import React, { useState } from 'react';
import { DeviationAnalysis, DataSourceDiagnostics } from '../types';
import { Lock, Unlock } from 'lucide-react';

interface Props {
  data: DeviationAnalysis[];
  diagnostics?: DataSourceDiagnostics;
}

export const VolatilityRankingTable: React.FC<Props> = ({ data, diagnostics }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Letmein') {
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center shadow-sm">
        <form onSubmit={handleUnlock} className="max-w-xs mx-auto space-y-3">
          <h3 className="font-bold text-slate-700">Show Technical Readings</h3>
          <div>
            <input 
              type="password" 
              placeholder="Enter Passcode"
              className="w-full bg-slate-100 border border-slate-300 text-slate-800 text-center text-sm font-mono py-2 rounded-lg focus:outline-none focus:border-slate-500"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              autoFocus
            />
             {error && <p className="text-xs text-rose-600 font-bold mt-1">ACCESS DENIED</p>}
          </div>
          <button 
            type="submit"
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }
  
  const sortedData = [...data].sort((a, b) => (b.pipDifference || 0) - (a.pipDifference || 0));

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
       <div className="p-4 border-b border-slate-200 flex justify-between items-center">
         <h3 className="text-lg font-bold text-slate-800">Internal Ranking Matrix</h3>
         <button onClick={() => setIsUnlocked(false)} className="text-slate-500 hover:text-slate-800">
            <Lock className="w-4 h-4" />
         </button>
       </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-2">Rank</th>
              <th className="px-4 py-2">Pair</th>
              <th className="px-4 py-2 text-right">Volatility (Pips)</th>
              <th className="px-4 py-2 text-right">Yearly Potential (Pips)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedData.map((row, index) => (
                <tr key={row.symbol} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-bold">{index + 1}</td>
                  <td className="px-4 py-2 font-bold text-slate-700">{row.symbol}</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-600">{row.pipDifference?.toFixed(0)}</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-500">{row.yearlyPotentialPips.toFixed(0)}</td>
                </tr>
             ))}
          </tbody>
        </table>
      </div>
       {diagnostics && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
              <h4 className="text-sm font-bold text-slate-600 mb-3">Data Source Diagnostics</h4>
              <div className="space-y-2">
                 <p className="text-xs">
                    <span className="font-bold">Matched:</span> {diagnostics.matchedInstruments.join(', ')}
                 </p>
                 <p className="text-xs">
                     <span className="font-bold">Unrecognized:</span> {diagnostics.unmatchedEntries.length > 0 ? diagnostics.unmatchedEntries.join(', ') : 'None'}
                 </p>
              </div>
          </div>
      )}
    </div>
  );
};