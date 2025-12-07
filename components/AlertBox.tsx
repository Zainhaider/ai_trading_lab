import React from 'react';
import { AnalysisResult, Theme, TradeSuggestion } from '../types';
import { TrendingUp, TrendingDown, Zap, ShieldAlert, Target } from 'lucide-react';
import { getPipMultiplier } from '../constants';

interface AlertBoxProps {
  result: AnalysisResult;
  theme?: Theme;
}

export const AlertBox: React.FC<AlertBoxProps> = ({ result }) => {
  const { hotPair, rawMarketData } = result;

  if (!hotPair) return null;

  const getRate = (pair: string): number | null => {
    const p = rawMarketData.find(d => d.symbol === pair);
    return p ? p.currentPrice : null;
  };
  
  const calculateCrossPrice = (pair: string): string => {
      const direct = getRate(pair);
      if (direct) return direct.toFixed(pair.includes('JPY') ? 3 : 5);

      const eurusd = getRate('EURUSD'), gbpusd = getRate('GBPUSD'), audusd = getRate('AUDUSD'),
            nzdusd = getRate('NZDUSD'), usdcad = getRate('USDCAD'), usdchf = getRate('USDCHF'), 
            usdjpy = getRate('USDJPY');

      if (!eurusd || !gbpusd || !audusd || !nzdusd || !usdcad || !usdchf || !usdjpy) return '---';

      let price = 0;
      if (pair === 'EURGBP') price = eurusd / gbpusd; else if (pair === 'EURAUD') price = eurusd / audusd;
      else if (pair === 'EURNZD') price = eurusd / nzdusd; else if (pair === 'EURCAD') price = eurusd * usdcad;
      else if (pair === 'EURCHF') price = eurusd * usdchf; else if (pair === 'EURJPY') price = eurusd * usdjpy;
      else if (pair === 'GBPAUD') price = gbpusd / audusd; else if (pair === 'GBPNZD') price = gbpusd / nzdusd;
      else if (pair === 'GBPCAD') price = gbpusd * usdcad; else if (pair === 'GBPCHF') price = gbpusd * usdchf;
      else if (pair === 'GBPJPY') price = gbpusd * usdjpy; else if (pair === 'AUDNZD') price = audusd / nzdusd;
      else if (pair === 'AUDCAD') price = audusd * usdcad; else if (pair === 'AUDCHF') price = audusd * usdchf;
      else if (pair === 'AUDJPY') price = audusd * usdjpy; else if (pair === 'NZDCAD') price = nzdusd * usdcad;
      else if (pair === 'NZDCHF') price = nzdusd * usdchf; else if (pair === 'NZDJPY') price = nzdusd * usdjpy;
      else if (pair === 'CADCHF') price = usdchf / usdcad; else if (pair === 'CADJPY') price = usdjpy / usdcad;
      else if (pair === 'CHFJPY') price = usdjpy / usdchf;

      return price > 0 ? price.toFixed(pair.includes('JPY') ? 3 : 5) : '---';
  };

  const SuggestionList = ({ suggestions }: { suggestions?: TradeSuggestion[] }) => {
      if (!suggestions || suggestions.length === 0) return null;
      return (
          <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-600 mb-3">More Suggestions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map((s, idx) => {
                      const isBuy = s.action === 'BUY';
                      const actionLabel = s.isTemporary ? `TEMP. ${s.action}` : s.action;
                      return (
                        <div key={idx} className="border border-slate-200 bg-slate-50 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-slate-800 text-lg">{s.pair}</span>
                                    <span className={`block text-xs font-bold ${isBuy ? 'text-emerald-600' : 'text-rose-600'}`}>{actionLabel}</span>
                                </div>
                                <span className="font-mono font-semibold text-slate-700">{calculateCrossPrice(s.pair)}</span>
                            </div>
                        </div>
                      );
                  })}
              </div>
          </div>
      );
  };
  
  const isHotBuy = hotPair.effectiveBias === 'Long';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
      <div className="border-b border-slate-200 pb-4 mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">#1 Market Driver</h3>
        <div className="flex justify-between items-baseline">
            <h2 className="text-5xl font-extrabold text-slate-800">{hotPair.pair}</h2>
            <div className={`flex items-center gap-2 text-2xl font-bold ${isHotBuy ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isHotBuy ? <TrendingUp /> : <TrendingDown />}
                <span>{hotPair.effectiveBias}</span>
            </div>
        </div>
      </div>
      
      {hotPair.tradeSetup && (
         <div className="mb-6">
             <h4 className="text-sm font-bold text-slate-600 mb-3">Tactical Execution</h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                 <div className="p-3 rounded-lg flex flex-col items-center bg-slate-100 border border-slate-200">
                     <span className="text-xs font-bold text-slate-500">Entry</span>
                     <span className="text-xl font-mono font-bold text-slate-800">
                         {hotPair.tradeSetup.entry.toFixed(hotPair.pair.includes('JPY') ? 3 : 5)}
                     </span>
                 </div>
                 <div className="p-3 rounded-lg flex flex-col items-center bg-rose-50 border border-rose-200">
                     <span className="text-xs font-bold text-rose-600 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Stop Loss</span>
                     <span className="text-xl font-mono font-bold text-rose-700">
                         {hotPair.tradeSetup.stopLoss.toFixed(hotPair.pair.includes('JPY') ? 3 : 5)}
                     </span>
                 </div>
                 <div className="p-3 rounded-lg flex flex-col items-center bg-emerald-50 border border-emerald-200">
                     <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Target className="w-3 h-3"/> Target</span>
                     <span className="text-xl font-mono font-bold text-emerald-700">
                         {hotPair.tradeSetup.target.toFixed(hotPair.pair.includes('JPY') ? 3 : 5)}
                     </span>
                 </div>
             </div>
             <div className="mt-2 text-center">
                 <span className={`text-xs font-bold ${hotPair.tradeSetup.isValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {hotPair.tradeSetup.isValid ? `R:R RATIO 1:${hotPair.tradeSetup.rrRatio}` : 'SETUP INVALID: LOW R:R'}
                 </span>
             </div>
         </div>
      )}

      <SuggestionList suggestions={hotPair.derivedPairs} />
    </div>
  );
};