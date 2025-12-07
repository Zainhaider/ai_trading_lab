import React from 'react';
import { USDPotential } from '../types';

interface Props {
  data: USDPotential[];
}

export const USDDashboard: React.FC<Props> = ({ data }) => {
  return (
    <div className="space-y-2">
      {data.map((item, index) => {
        const isBuy = item.action === 'BUY';
        return (
          <div key={index} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-lg text-slate-800">{item.pair}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${isBuy ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{item.action}</span>
            </div>
            <div className="text-right">
              <p className="font-mono font-semibold text-sm text-slate-600">{item.potentialPips.toFixed(0)} pips potential</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};