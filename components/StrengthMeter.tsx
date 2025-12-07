import React from 'react';
import { CurrencyScore } from '../types';

interface Props {
  scores: CurrencyScore[];
}

export const StrengthMeter: React.FC<Props> = ({ scores }) => {

  const getStyle = (sentiment: 'Strong' | 'Neutral' | 'Weak') => {
    switch (sentiment) {
      case 'Strong': return { dot: 'bg-emerald-500', text: 'text-emerald-600' };
      case 'Weak': return { dot: 'bg-rose-500', text: 'text-rose-600' };
      default: return { dot: 'bg-blue-500', text: 'text-blue-600' };
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
       {scores.map((item) => {
          const style = getStyle(item.sentiment);
          return (
              <div key={item.currency} className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
                  <div className="font-bold text-lg text-slate-800">{item.currency}</div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                      <span className={`text-xs font-bold ${style.text}`}>{item.sentiment.toUpperCase()}</span>
                  </div>
              </div>
          );
       })}
    </div>
  );
};