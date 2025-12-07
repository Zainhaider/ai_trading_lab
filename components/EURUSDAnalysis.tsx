import React from 'react';
import { EURUSDIndex, DerivedTradeOpportunity } from '../types';

interface Props {
  index: EURUSDIndex;
  opportunities: DerivedTradeOpportunity[];
}

export const EURUSDAnalysis: React.FC<Props> = ({ index, opportunities }) => {
  const isConfluenceHigh = index.confluence === 'High';

  const BiasDisplay = ({ currency, bias }: { currency: string, bias: 'Strong' | 'Weak' }) => {
    const isStrong = bias === 'Strong';
    return (
      <div className={`p-4 rounded-lg w-full text-center ${isStrong ? 'bg-emerald-50' : 'bg-rose-50'}`}>
        <span className="text-sm font-bold text-slate-500">{currency}</span>
        <div className={`mt-1 text-xl font-extrabold ${isStrong ? 'text-emerald-600' : 'text-rose-600'}`}>
          <span>{bias}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
           <h3 className="text-lg font-bold text-slate-800 mb-3">EUR/USD INDEX</h3>
           <div className="flex gap-4">
              <BiasDisplay currency="EUR" bias={index.eurBias} />
              <BiasDisplay currency="USD" bias={index.usdBias} />
           </div>
           <div className={`mt-3 p-2 rounded-lg text-center text-xs font-bold ${isConfluenceHigh ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              Confluence Score: {index.confluence.toUpperCase()}
           </div>
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3">Derived Trades</h3>
            <div className="space-y-2">
              {opportunities.map((op, index) => {
                const isBuy = op.action === 'BUY';
                return (
                  <div key={index} className="p-3 rounded-lg border bg-slate-50 border-slate-200 flex justify-between items-center">
                    <span className="font-mono font-bold text-base text-slate-700">{op.pair}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${isBuy ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{op.action}</span>
                  </div>
                );
              })}
               {opportunities.length === 0 && (
                  <p className="text-xs text-center text-slate-400 italic py-4">No high-probability trades found.</p>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};