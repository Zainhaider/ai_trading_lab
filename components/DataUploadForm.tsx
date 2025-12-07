import React, { useState, useCallback } from 'react';
import { DEFAULT_SHEET_URL, MAJOR_PAIRS } from '../constants';
import { ManualInputData, DataSourceDiagnostics } from '../types';
import { RotateCcw, AlertTriangle, Link, Zap } from 'lucide-react';

interface Props {
  onAnalyze: (data: ManualInputData, diagnostics: DataSourceDiagnostics) => void;
  isAnalyzing: boolean;
}

export const DataUploadForm: React.FC<Props> = ({ onAnalyze, isAnalyzing }) => {
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const parseCSV = useCallback((text: string) => {
    try {
      const lines = text.split('\n');
      const newInputs: ManualInputData = {}; 
      const diagnostics: DataSourceDiagnostics = {
        matchedInstruments: [],
        unmatchedEntries: []
      };
      
      lines.forEach((line, index) => {
        const cleanLine = line.trim();
        if (!cleanLine) return;
        
        const cols = cleanLine.split(',').map(c => c.trim());
        if (cols.length < 3) return;

        const rawPair = cols[0].toUpperCase().replace(/\s/g, '').replace('/', '');
        let symbol: string | undefined = undefined;

        if (MAJOR_PAIRS.includes(rawPair)) {
            symbol = rawPair;
        }

        if (symbol) {
          newInputs[symbol] = {
            currentPrice: cols[1] || '',
            sma135: cols[2] || '0', 
            sma27: cols[3] || '', 
            weeklyHigh: cols[4] || '',
            weeklyLow: cols[5] || '',
            monthlyHigh: cols[6] || '',
            monthlyLow: cols[7] || '',
            yearlyHigh: cols[8] || '',
            yearlyLow: cols[9] || ''
          };
          if (!diagnostics.matchedInstruments.includes(symbol)) {
            diagnostics.matchedInstruments.push(symbol);
          }
        } else {
           if (rawPair && index !== 0 && !rawPair.toLowerCase().includes('pair')) {
               diagnostics.unmatchedEntries.push(cols[0]);
            }
        }
      });

      if (diagnostics.matchedInstruments.length === 0) {
        setCsvError("No matching Forex instruments found in data source. Check symbol names in your sheet.");
      } else {
        setCsvError(null);
        onAnalyze(newInputs, diagnostics);
      }
    } catch (err) {
      setCsvError("Failed to parse data.");
    }
  }, [onAnalyze]);

  const handleStartLiveAction = async () => {
    setCsvError(null);
    setIsFetching(true);

    try {
      const url = new URL(DEFAULT_SHEET_URL);
      url.searchParams.set('t', new Date().getTime().toString());
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Network response was not ok');
      const text = await response.text();
      parseCSV(text);
    } catch (err) {
      setCsvError("Failed to connect to Data Source. Please check internet or the link.");
    } finally {
      setIsFetching(false);
    }
  };
  
  const isLoading = isFetching || isAnalyzing;

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
      <div className="text-center space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">A.I. Market Scan</h2>
          <p className="text-slate-500 mt-1">Connect to Google Sheet to run analysis.</p>
        </div>
        
        <button
            onClick={handleStartLiveAction}
            disabled={isLoading}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors w-64"
        >
            {isLoading ? (
                <>
                    <RotateCcw className="w-5 h-5 animate-spin" />
                    <span>Scanning...</span>
                </>
            ) : (
                <>
                    <Zap className="w-5 h-5" />
                    <span>Start LIVE Action</span>
                </>
            )}
        </button>
        
        {csvError && (
            <div className="flex items-center justify-center gap-2 text-rose-600 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                {csvError}
            </div>
        )}
      </div>
    </div>
  );
}