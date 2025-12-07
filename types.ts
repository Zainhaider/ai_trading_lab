export type Theme = 'dark' | 'light';

export interface ForexPairData {
  symbol: string;
  currentPrice: number;
  sma135: number;
  sma27: number;
  weeklyHigh: number;
  weeklyLow: number;
  monthlyHigh: number;
  monthlyLow: number;
  yearlyHigh: number; 
  yearlyLow: number;
  weeklyMedian?: number;
  monthlyMedian?: number;
}

export interface DeviationAnalysis {
  symbol: string;
  pipDifference: number;
  monthlyRangePips: number;
  yearlyPotentialPips: number;
  isOverExtended: boolean;
  type: 'Bullish' | 'Bearish'; 
  effectiveBias: 'Long' | 'Short';
  setupQuality: 'PERFECT' | 'MIXED' | 'WEAK' | 'TEMPORARY_SELL' | 'TEMPORARY_BUY' | 'WAITING';
}

export interface TradeSuggestion {
  pair: string;
  action: 'BUY' | 'SELL';
  isTemporary?: boolean;
  reason: string;
}

export interface TradeSetup {
  entry: number;
  stopLoss: number;
  target: number;
  riskPips: number;
  rewardPips: number;
  rrRatio: number;
  isValid: boolean;
  status: 'ACTIVE' | 'WAITING' | 'INVALID';
  note?: string;
}

export interface VolatilityAlert {
  pair: string;
  deviation: number;
  bias: 'Long' | 'Short';
  effectiveBias: 'Long' | 'Short'; 
  severity: 'Extreme' | 'High' | 'Moderate';
  setupQuality: 'PERFECT' | 'MIXED' | 'WEAK' | 'TEMPORARY_SELL' | 'TEMPORARY_BUY' | 'WAITING';
  derivedPairs?: TradeSuggestion[]; 
  tradeSetup?: TradeSetup;
  suggestionSource?: 'ACTIVITY' | 'STRENGTH';
}

export interface CurrencyScore {
  currency: string;
  score: number; 
  sentiment: 'Strong' | 'Neutral' | 'Weak';
  delta: number; 
}

export interface ActivityScore {
  currency: string;
  score: number; 
  direction: 'Strength' | 'Weakness' | 'Mixed' | 'Inactive';
  highestPotentialPair?: {
    pair: string;
    action: 'BUY' | 'SELL';
    potentialPips: number;
  };
}

export interface EURUSDIndex {
  eurBias: 'Strong' | 'Weak';
  usdBias: 'Strong' | 'Weak';
  confluence: 'High' | 'Low';
}

export interface DerivedTradeOpportunity {
  pair: string;
  action: 'BUY' | 'SELL';
  reason: string;
}

export interface USDPotential {
  pair: string;
  action: 'BUY' | 'SELL';
  potentialPips: number;
  progress: number;
}

export interface DataSourceDiagnostics {
  matchedInstruments: string[];
  unmatchedEntries: string[];
}

export interface AnalysisResult {
  rawMarketData: ForexPairData[];
  analysisTimestamp: string;
  rankedPairs: DeviationAnalysis[];
  hotPair: VolatilityAlert;
  runnerUpPair?: VolatilityAlert;
  focusCurrency: string;
  focusCurrencyStrength: 'Strong' | 'Weak';
  currencyStrengthRanking: CurrencyScore[]; 
  activityMatrix: ActivityScore[];
  usdDashboardData?: USDPotential[];
  aiReasoning: string;
  eurusdIndex?: EURUSDIndex;
  eurusdDerivedTrades?: DerivedTradeOpportunity[];
  diagnostics?: DataSourceDiagnostics;
}

export type ManualInputData = Record<string, { 
  currentPrice: string; 
  sma135: string;
  sma27: string;
  weeklyHigh: string;
  weeklyLow: string;
  monthlyHigh: string;
  monthlyLow: string;
  yearlyHigh: string; 
  yearlyLow: string;
}>;