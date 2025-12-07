import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DataUploadForm } from './components/DataUploadForm';
import { TickerTape } from './components/TickerTape';
import { MarketStatus } from './components/MarketStatus';
import { AnalysisResult, ManualInputData, ForexPairData, Theme, DataSourceDiagnostics } from './types';
import { performAnalysis } from './services/geminiService';
import { MAJOR_PAIRS } from './constants';

export default function App() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    const checkMarketStatus = () => {
        const now = new Date();
        const day = now.getDay();
        if (day === 0 || day === 6) {
            setIsMarketOpen(false);
            return;
        }
        const londonTime = parseInt(now.toLocaleTimeString('en-US', { timeZone: 'Europe/London', hour12: false, hour: 'numeric' }));
        const isLondonOpen = londonTime >= 8 && londonTime < 17;
        const nyTime = parseInt(now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false, hour: 'numeric' }));
        const isNyOpen = nyTime >= 8 && nyTime < 17;
        setIsMarketOpen(isLondonOpen || isNyOpen);
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const processManualData = (inputs: ManualInputData): ForexPairData[] => {
    return Object.entries(inputs).map(([symbol, values]) => {
      const safeParse = (val: string) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      };

      const wHigh = safeParse(values.weeklyHigh);
      const wLow = safeParse(values.weeklyLow);
      const mHigh = safeParse(values.monthlyHigh);
      const mLow = safeParse(values.monthlyLow);
      const yHigh = safeParse(values.yearlyHigh);
      const yLow = safeParse(values.yearlyLow);

      return {
        symbol,
        currentPrice: safeParse(values.currentPrice),
        sma135: safeParse(values.sma135),
        sma27: safeParse(values.sma27),
        weeklyHigh: wHigh,
        weeklyLow: wLow,
        monthlyHigh: mHigh,
        monthlyLow: mLow,
        yearlyHigh: yHigh,
        yearlyLow: yLow,
        weeklyMedian: wLow > 0 && wHigh > 0 ? (wHigh + wLow) / 2 : 0,
        monthlyMedian: mLow > 0 && mHigh > 0 ? (mHigh + mLow) / 2 : 0,
      };
    });
  };

  const handleRunAnalysis = async (manualData: ManualInputData, diagnostics: DataSourceDiagnostics) => {
    setAnalyzing(true);
    setError(null);

    try {
      const dataForService = processManualData(manualData);
      
      const hasValidData = dataForService.some(d => MAJOR_PAIRS.includes(d.symbol) && d.currentPrice > 0);
      if (!hasValidData) {
         throw new Error("No valid Forex price data found. Please check your inputs or CSV.");
      }

      const data = await performAnalysis(() => {}, dataForService, diagnostics);
      
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12">
      
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 grid grid-cols-3 gap-4 items-center">
          <div className="flex justify-start">
             <MarketStatus />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2 text-slate-800">
              A.I Trading LAB
            </h1>
            <p className="text-slate-500 text-xs">
              <span className="italic">Design by</span> <span className="italic font-bold ml-1">Zain Haider</span>
            </p>
          </div>
          <div className="flex justify-end items-center gap-3">
             <div className="text-xs font-bold uppercase tracking-wider">
                {isMarketOpen ? (
                    <span className="text-emerald-600">Market Live</span>
                ) : (
                    <span className="text-rose-600">Market Closed</span>
                )}
             </div>
          </div>
        </div>
      </header>
      <div className="w-full">
         <TickerTape data={result?.rawMarketData} />
      </div>
      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-8 space-y-6">
        {error && (
          <div className="bg-rose-100 border border-rose-200 p-4 rounded-lg flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <div>
              <h4 className="text-rose-800 font-bold text-sm">Analysis Error</h4>
              <p className="text-rose-700 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}
        {!result && (
           <DataUploadForm onAnalyze={handleRunAnalysis} isAnalyzing={analyzing} />
        )}
        <main>
           <Dashboard result={result} isAnalyzing={analyzing} />
           {result && (
              <div className="mt-8 flex justify-center border-t border-slate-200 pt-6">
                 <button 
                   onClick={() => setResult(null)}
                   className="px-6 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 font-semibold transition-colors flex items-center gap-2 text-sm shadow"
                 >
                   <RefreshCw className="w-4 h-4" />
                   New Analysis
                 </button>
              </div>
           )}
        </main>
      </div>
    </div>
  );
}