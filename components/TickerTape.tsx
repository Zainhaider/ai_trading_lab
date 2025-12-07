import React from 'react';
import { ForexPairData } from '../types';
import { MAJOR_PAIRS, VALID_PAIRS } from '../constants';

interface TickerTapeProps {
  data?: ForexPairData[];
}

export const TickerTape: React.FC<TickerTapeProps> = ({ data }) => {
  
  const calculateAllRates = () => {
    if (!data || data.length === 0) {
      return MAJOR_PAIRS.map(pair => ({
        symbol: pair,
        price: '...',
      }));
    }

    const rates: Record<string, number> = {};
    data.forEach(d => {
      rates[d.symbol] = d.currentPrice;
    });

    const get = (pair: string) => rates[pair];

    return VALID_PAIRS.map(pair => {
      let price = 0;
      let isCalculated = false;

      if (rates[pair]) {
        price = rates[pair];
        isCalculated = true;
      } 
      else {
        const base = pair.substring(0, 3);
        const quote = pair.substring(3, 6);
        if (get(`${base}USD`) && get(`${quote}USD`)) { price = get(`${base}USD`) / get(`${quote}USD`); isCalculated = true; }
        else if (get(`${base}USD`) && get(`USD${quote}`)) { price = get(`${base}USD`) * get(`USD${quote}`); isCalculated = true; }
        else if (get(`USD${quote}`) && get(`USD${base}`)) { price = get(`USD${quote}`) / get(`USD${base}`); isCalculated = true; }
      }
      return {
        symbol: pair,
        price: isCalculated ? price.toFixed(pair.includes('JPY') ? 3 : 5) : '---',
      };
    });
  };

  const tickerItems = calculateAllRates();
  const marqueeItems = [...tickerItems, ...tickerItems];

  return (
    <div className="w-full bg-white border-b border-slate-200 overflow-hidden py-2 flex items-center h-10">
       <div className="flex whitespace-nowrap animate-marquee">
          {marqueeItems.map((item, idx) => (
             <div key={`${item.symbol}-${idx}`} className="flex items-baseline gap-2 mx-4">
                <span className="font-semibold text-slate-500 text-xs">
                  {item.symbol}
                </span>
                <span className="font-mono font-bold text-sm text-slate-800">
                  {item.price}
                </span>
             </div>
          ))}
       </div>
       <style>{`
         .animate-marquee { animation: marquee 60s linear infinite; }
         @keyframes marquee {
           0% { transform: translateX(0); }
           100% { transform: translateX(-50%); }
         }
       `}</style>
    </div>
  );
};