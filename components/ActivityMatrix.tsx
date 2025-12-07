import React from 'react';
import { ActivityScore } from '../types';

interface Props {
  scores: ActivityScore[];
}

export const ActivityMatrix: React.FC<Props> = ({ scores }) => {
  
  const getStyle = (direction: ActivityScore['direction']) => {
    switch(direction) {
      case 'Strength': return 'bg-emerald-500';
      case 'Weakness': return 'bg-rose-500';
      case 'Mixed': return 'bg-amber-500';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Activity Matrix</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
         {scores.map((item) => {
            const labelText = item.direction === 'Inactive' ? 'INACTIVE' : 'ACTIVE';
            return (
                <div key={item.currency} className="text-center p-3 bg-slate-50 rounded-md">
                    <div className="font-bold text-lg text-slate-800">{item.currency}</div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${getStyle(item.direction)}`}></span>
                        <span className="text-xs font-semibold text-slate-500">{labelText}</span>
                    </div>
                </div>
            );
         })}
      </div>
    </div>
  );
};