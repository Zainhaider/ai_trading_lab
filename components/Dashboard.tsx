import React, { useState } from 'react';
import { AnalysisResult, Theme } from '../types';
import { AlertBox } from './AlertBox';
import { StrengthMeter } from './StrengthMeter';
import { VolatilityRankingTable } from './VolatilityRankingTable';
import { ChevronDown, Zap, DollarSign } from 'lucide-react';
import { ActivityMatrix } from './ActivityMatrix';
import { USDDashboard } from './USDDashboard'; 
import { EURUSDAnalysis } from './EURUSDAnalysis';

interface DashboardProps {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  theme?: Theme; // Kept for prop compatibility, but unused in simple design
}

export const Dashboard: React.FC<DashboardProps> = ({ result, isAnalyzing }) => {
  const [isStrengthMeterVisible, setIsStrengthMeterVisible] = useState(false);
  const [isUsdDashboardVisible, setIsUsdDashboardVisible] = useState(false);

  if (!result && !isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-[40vh] text-center space-y-4">
          <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-800">System Ready</h2>
              <p className="text-slate-500 max-w-sm mx-auto text-sm">
                 Awaiting data to begin scan.
              </p>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {result && (
        <div className="flex flex-col gap-6 mt-2">
            <AlertBox result={result} />
            
            {result.eurusdIndex && result.eurusdDerivedTrades && (
              <EURUSDAnalysis 
                index={result.eurusdIndex} 
                opportunities={result.eurusdDerivedTrades} 
              />
            )}
            
            <ActivityMatrix scores={result.activityMatrix || []} />
            
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <button 
                onClick={() => setIsStrengthMeterVisible(!isStrengthMeterVisible)}
                className="w-full flex items-center justify-between p-4"
              >
                <h3 className="text-lg font-bold text-slate-800">Currency Matrix</h3>
                <ChevronDown 
                  className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isStrengthMeterVisible ? 'rotate-180' : ''}`} 
                />
              </button>
              {isStrengthMeterVisible && (
                <div className="p-4 pt-0">
                  <StrengthMeter scores={result.currencyStrengthRanking || []} />
                </div>
              )}
            </div>

            {result.usdDashboardData && result.usdDashboardData.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                  <button 
                    onClick={() => setIsUsdDashboardVisible(!isUsdDashboardVisible)}
                    className="w-full flex items-center justify-between p-4"
                  >
                      <h3 className="text-lg font-bold text-slate-800">USD Opportunity Dashboard</h3>
                      <ChevronDown 
                          className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isUsdDashboardVisible ? 'rotate-180' : ''}`} 
                      />
                  </button>
                  {isUsdDashboardVisible && (
                      <div className="p-4 pt-0">
                          <USDDashboard data={result.usdDashboardData} />
                      </div>
                  )}
              </div>
            )}
            
            <VolatilityRankingTable data={result.rankedPairs} diagnostics={result.diagnostics} />
        </div>
      )}
    </div>
  );
};