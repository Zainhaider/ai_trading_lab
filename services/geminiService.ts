import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
    AnalysisResult, ForexPairData, CurrencyScore, VolatilityAlert, TradeSuggestion,
    TradeSetup, EURUSDIndex, DerivedTradeOpportunity, ActivityScore, USDPotential, DeviationAnalysis,
    DataSourceDiagnostics
} from '../types';
import { VALID_PAIRS, getPipMultiplier, MAJOR_PAIRS } from '../constants';

const BASE_SYSTEM_INSTRUCTION = `
You are an Institutional Forex Strategist. Your goal is to find High-Probability Trade Setups based on VOLATILITY and CONFLUENCE using the provided dataset.
Your task is to analyze the provided data and identify the single most volatile pair (the "Market Driver") based on its pip distance from its "Trend Base".
Based on this, you must determine the Focus Currency (the non-USD component of the volatile pair) and its current strength (Strong or Weak).
IMPORTANT OUTPUT RULE: You MUST return ONLY a valid JSON object. Do not include any conversational text or Markdown formatting.
Output Format (JSON ONLY):
{
  "hotPair": { 
      "pair": "USDJPY", 
      "deviation": 250, 
      "bias": "Long", 
      "effectiveBias": "Long",
      "severity": "Extreme",
      "setupQuality": "PERFECT" 
  },
  "focusCurrency": "JPY",
  "focusCurrencyStrength": "Weak", 
  "aiReasoning": "USDJPY selected as the Market Driver due to the highest deviation from the Trend Base."
}
`;

async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries <= 0) throw error;
    const isTransient = error.message?.includes('500') || error.message?.includes('xhr') || error.message?.includes('fetch');
    if (isTransient) {
      console.warn(`Operation failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

const calculateEURUSDSentiment = (eurusdData: ForexPairData | undefined): EURUSDIndex | undefined => {
  if (!eurusdData || !eurusdData.monthlyMedian || eurusdData.monthlyMedian === 0) return undefined;
  
  const { currentPrice, monthlyMedian, sma27 } = eurusdData;
  const isAboveMedian = currentPrice > monthlyMedian;
  const eurBias = isAboveMedian ? 'Strong' : 'Weak';
  const usdBias = isAboveMedian ? 'Weak' : 'Strong';

  let confluence: 'High' | 'Low' = 'Low';
  if (isAboveMedian && currentPrice > sma27) {
    confluence = 'High';
  } else if (!isAboveMedian && currentPrice < sma27) {
    confluence = 'High';
  }
  
  return { eurBias, usdBias, confluence };
};

const generateTradeOpportunities = (index: EURUSDIndex, matrix: CurrencyScore[]): DerivedTradeOpportunity[] => {
  const opportunities: DerivedTradeOpportunity[] = [];
  const priorityList = ['EUR', 'GBP', 'AUD', 'NZD', 'USD', 'CAD', 'CHF', 'JPY'];

  if (index.eurBias === 'Strong') {
    const weakCurrencies = matrix.filter(c => c.sentiment === 'Weak' && c.currency !== 'EUR').map(c => c.currency);
    for (const weak of weakCurrencies) {
      opportunities.push({ pair: `EUR${weak}`, action: 'BUY', reason: `EUR Strong vs ${weak} Weak` });
    }
  } else {
    const strongCurrencies = matrix.filter(c => c.sentiment === 'Strong' && c.currency !== 'EUR').map(c => c.currency);
     for (const strong of strongCurrencies) {
      opportunities.push({ pair: `EUR${strong}`, action: 'SELL', reason: `EUR Weak vs ${strong} Strong` });
    }
  }

  if (index.usdBias === 'Weak') {
    const strongCurrencies = matrix.filter(c => c.sentiment === 'Strong' && c.currency !== 'USD').map(c => c.currency);
    for (const strong of strongCurrencies) {
       if (priorityList.indexOf(strong) < priorityList.indexOf('USD')) {
          opportunities.push({ pair: `${strong}USD`, action: 'BUY', reason: `${strong} Strong vs USD Weak` });
       } else {
          opportunities.push({ pair: `USD${strong}`, action: 'SELL', reason: `USD Weak vs ${strong} Strong` });
       }
    }
  } else {
    const weakCurrencies = matrix.filter(c => c.sentiment === 'Weak' && c.currency !== 'USD').map(c => c.currency);
    for (const weak of weakCurrencies) {
       if (priorityList.indexOf(weak) < priorityList.indexOf('USD')) {
          opportunities.push({ pair: `${weak}USD`, action: 'SELL', reason: `${weak} Weak vs USD Strong` });
       } else {
          opportunities.push({ pair: `USD${weak}`, action: 'BUY', reason: `USD Strong vs ${weak} Strong` });
       }
    }
  }

  return opportunities
    .filter(op => VALID_PAIRS.includes(op.pair))
    .filter((op, index, self) => self.findIndex(t => t.pair === op.pair) === index);
};

const calculateCurrencyStrength = (data: ForexPairData[]): CurrencyScore[] => {
  const scores: Record<string, number> = { USD: 0, EUR: 0, GBP: 0, JPY: 0, AUD: 0, CAD: 0, CHF: 0, NZD: 0 };
  data.forEach(d => {
    if (d.sma135 === 0 || d.sma27 === 0) return;
    const base = d.symbol.substring(0, 3);
    const quote = d.symbol.substring(3, 6);
    const multiplier = getPipMultiplier(d.symbol);
    const diff135 = (d.currentPrice - d.sma135) * multiplier;
    const diff27 = (d.currentPrice - d.sma27) * multiplier;
    const rawDiff = (diff135 * 0.7) + (diff27 * 0.3);
    const weight = rawDiff / 10; 
    if (scores[base] !== undefined) scores[base] += weight;
    if (scores[quote] !== undefined) scores[quote] -= weight;
  });

  const values = Object.values(scores);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1; 

  return Object.entries(scores).map(([currency, rawScore]) => {
    const normalized = ((rawScore - minVal) / range) * 10;
    let sentiment: 'Strong' | 'Neutral' | 'Weak' = 'Neutral';
    if (normalized > 7) sentiment = 'Strong';
    if (normalized < 3) sentiment = 'Weak';
    return { currency, score: Number(normalized.toFixed(1)), sentiment, delta: rawScore };
  }).sort((a, b) => b.score - a.score);
};

const calculateActivityMatrix = (data: ForexPairData[]): ActivityScore[] => {
  const activityScores: Record<string, number> = { USD: 0, EUR: 0, GBP: 0, JPY: 0, AUD: 0, CAD: 0, CHF: 0, NZD: 0 };
  const directionalScores: Record<string, number> = { USD: 0, EUR: 0, GBP: 0, JPY: 0, AUD: 0, CAD: 0, CHF: 0, NZD: 0 };
  data.forEach(d => {
    const { symbol, currentPrice, monthlyHigh, monthlyLow } = d;
    if (monthlyHigh <= monthlyLow) return;
    
    const multiplier = getPipMultiplier(symbol);
    const monthlyRangePips = (monthlyHigh - monthlyLow) * multiplier;
    let breakoutDistancePips = 0;
    let direction = 0;

    if (currentPrice > monthlyHigh) {
        breakoutDistancePips = (currentPrice - monthlyHigh) * multiplier;
        direction = 1;
    } else if (currentPrice < monthlyLow) {
        breakoutDistancePips = (monthlyLow - currentPrice) * multiplier;
        direction = -1;
    }

    if (breakoutDistancePips > 0 && monthlyRangePips > 0) {
        const activityPercentage = (breakoutDistancePips / monthlyRangePips) * 100;
        const base = symbol.substring(0, 3);
        const quote = symbol.substring(3, 6);
        if (activityScores[base] !== undefined) activityScores[base] += activityPercentage;
        if (activityScores[quote] !== undefined) activityScores[quote] += activityPercentage;
        if (directionalScores[base] !== undefined) directionalScores[base] += direction;
        if (directionalScores[quote] !== undefined) directionalScores[quote] -= direction;
    }
  });

  return Object.entries(activityScores)
    .filter(([currency]) => currency !== 'USD')
    .map(([currency, rawScore]) => {
      const rawDirection = directionalScores[currency];
      let direction: 'Strength' | 'Weakness' | 'Mixed' | 'Inactive' = 'Inactive';
      if (rawScore > 0) { 
        if (rawDirection > 0) direction = 'Strength';
        else if (rawDirection < 0) direction = 'Weakness';
        else direction = 'Mixed';
      }
      return { currency, score: rawScore, direction };
    }).sort((a, b) => b.score - a.score);
};

const getVolatileCurrency = (pair: string): string => {
    const base = pair.substring(0, 3);
    const quote = pair.substring(3, 6);
    return base === 'USD' ? quote : base;
};

const generateDerivedPairs = (hotSetup: VolatilityAlert, strengthMatrix: CurrencyScore[], activityMatrix: ActivityScore[]): { suggestions: TradeSuggestion[]; source: 'ACTIVITY' | 'STRENGTH' } => {
  if (!hotSetup || !strengthMatrix.length || hotSetup.setupQuality === 'WAITING') {
    return { suggestions: [], source: 'STRENGTH' };
  }
  
  const focusCurrency = getVolatileCurrency(hotSetup.pair);
  const isPairLong = hotSetup.effectiveBias === 'Long';
  const isReversal = hotSetup.setupQuality.includes('TEMPORARY');
  let isFocusStrong = (focusCurrency === hotSetup.pair.substring(0, 3)) ? isPairLong : !isPairLong;
  if (isReversal) isFocusStrong = !isFocusStrong;

  let candidates: { currency: string }[] = [];
  let source: 'ACTIVITY' | 'STRENGTH' = 'STRENGTH';

  const activeCandidates = activityMatrix.filter(c => 
    (c.direction === 'Strength' && !isFocusStrong) || 
    (c.direction === 'Weakness' && isFocusStrong)
  );

  if (activeCandidates.length > 0) {
    source = 'ACTIVITY';
    candidates = activeCandidates;
  } else {
    source = 'STRENGTH';
    candidates = isFocusStrong 
      ? strengthMatrix.filter(c => c.sentiment === 'Weak')
      : strengthMatrix.filter(c => c.sentiment === 'Strong');
  }

  const finalCandidates = candidates.filter(c => c.currency !== focusCurrency && c.currency !== 'USD').slice(0, 2);
  const suggestions: TradeSuggestion[] = [];
  const priorityList = ['EUR', 'GBP', 'AUD', 'NZD', 'USD', 'CAD', 'CHF', 'JPY'];
  
  finalCandidates.forEach(opponent => {
    const [currA, currB] = [opponent.currency, focusCurrency].sort((a, b) => priorityList.indexOf(a) - priorityList.indexOf(b));
    const pairName = `${currA}${currB}`;
    if (!VALID_PAIRS.includes(pairName)) return;
    
    const baseCurrency = pairName.substring(0, 3);
    let action: 'BUY' | 'SELL' = (isFocusStrong === (focusCurrency === baseCurrency)) ? 'BUY' : 'SELL';
    
    suggestions.push({ pair: pairName, action, isTemporary: isReversal, reason: "" });
  });
  return { suggestions, source };
};

const calculateTradeLevels = (data: ForexPairData, direction: 'Long' | 'Short'): TradeSetup => {
    if (!data.sma27 || data.sma27 <= 0 || !data.monthlyHigh || data.monthlyHigh <= 0 || !data.monthlyLow || data.monthlyLow <= 0) {
        return { entry: data.currentPrice, stopLoss: 0, target: 0, riskPips: 0, rewardPips: 0, rrRatio: 0, isValid: false, status: 'INVALID', note: 'Missing key level data (SMA27 or Monthly Range).' };
    }
    const multiplier = getPipMultiplier(data.symbol);
    const stopLossPips = 50 / multiplier;
    const targetBufferPips = 15 / multiplier;
    const target = direction === 'Long' ? data.monthlyHigh - targetBufferPips : data.monthlyLow + targetBufferPips;
    const stopLoss = direction === 'Long' ? data.sma27 - stopLossPips : data.sma27 + stopLossPips;
    const reward = Math.abs(target - data.currentPrice) * multiplier;
    const risk = Math.abs(data.currentPrice - stopLoss) * multiplier;
    const rrRatio = risk > 0 ? reward / risk : 0;
    const isValid = rrRatio >= 2 && (direction === 'Long' ? (data.currentPrice < target && data.currentPrice > stopLoss) : (data.currentPrice > target && data.currentPrice < stopLoss));
    return { entry: data.currentPrice, stopLoss, target, riskPips: risk, rewardPips: reward, rrRatio: parseFloat(rrRatio.toFixed(2)), isValid, status: isValid ? 'ACTIVE' : 'INVALID' };
};

export const performAnalysis = async (onStatusUpdate: (status: string) => void, manualData: ForexPairData[], diagnostics: DataSourceDiagnostics): Promise<AnalysisResult> => {
  const forexData = manualData.filter(d => MAJOR_PAIRS.includes(d.symbol));
  
  if (!process.env.API_KEY) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: BASE_SYSTEM_INSTRUCTION } });

  const eurusdData = forexData.find(d => d.symbol === 'EURUSD');
  const eurusdIndex = calculateEURUSDSentiment(eurusdData);

  const rankedPairs = forexData.map((d): DeviationAnalysis => {
       const multiplier = getPipMultiplier(d.symbol);
       const smaDiff = Math.abs(d.currentPrice - d.sma135) * multiplier;
       const monthlyRange = Math.abs(d.monthlyHigh - d.monthlyLow) * multiplier;
       const primaryBias = d.currentPrice > d.sma135 ? 'Long' : 'Short';
       let effectiveBias: 'Long' | 'Short' = primaryBias;
       let setupQuality: DeviationAnalysis['setupQuality'] = 'MIXED';

       if (d.monthlyMedian && d.monthlyMedian > 0) {
            if (primaryBias === 'Long') {
                if (d.currentPrice > d.monthlyMedian && d.currentPrice > (d.sma27 || 0)) setupQuality = 'PERFECT';
                else if (d.currentPrice < d.monthlyMedian && d.currentPrice < (d.weeklyMedian || 0)) { effectiveBias = 'Short'; setupQuality = 'TEMPORARY_SELL'; } 
                else if (d.currentPrice < d.monthlyMedian) setupQuality = 'WAITING';
            } else { // Primary bias is Short
                if (d.currentPrice < d.monthlyMedian && d.currentPrice < (d.sma27 || 0)) setupQuality = 'PERFECT';
                else if (d.currentPrice > d.monthlyMedian && d.currentPrice > (d.weeklyMedian || 0)) { effectiveBias = 'Long'; setupQuality = 'TEMPORARY_BUY'; }
                else if (d.currentPrice > d.monthlyMedian) setupQuality = 'WAITING';
            }
       }
       
       let yearlyPotentialPips = 0;
       if (d.yearlyHigh > 0 && d.yearlyLow > 0) {
         if (effectiveBias === 'Long' && d.currentPrice < d.yearlyHigh) {
             yearlyPotentialPips = (d.yearlyHigh - d.currentPrice) * multiplier;
         } else if (effectiveBias === 'Short' && d.currentPrice > d.yearlyLow) {
             yearlyPotentialPips = (d.currentPrice - d.yearlyLow) * multiplier;
         }
       }

       return { symbol: d.symbol, pipDifference: smaDiff, monthlyRangePips: monthlyRange, yearlyPotentialPips, isOverExtended: smaDiff > 200, type: primaryBias === 'Long' ? 'Bullish' : 'Bearish', effectiveBias, setupQuality };
    }).sort((a,b) => b.pipDifference - a.pipDifference);

  if (rankedPairs.length === 0) {
      throw new Error("No Forex pairs were found in the provided data. Cannot perform analysis.");
  }
  
  const hotPairAnalysis = rankedPairs[0];
  const hotPairRaw = forexData.find(d => d.symbol === hotPairAnalysis.symbol);
  
  const activityMatrix = calculateActivityMatrix(forexData);

  const prompt = `MARKET DATASET: ${JSON.stringify(forexData)}\nHOT PAIR (Volatility Winner): ${hotPairAnalysis.symbol} \nEffective Bias: ${hotPairAnalysis.effectiveBias}, Quality: ${hotPairAnalysis.setupQuality}\nVerify this logic and return the JSON.`;
  
  const response = await retryOperation<GenerateContentResponse>(() => chat.sendMessage({ message: prompt }));
  const rawText = response.text || '';
  const startIndex = rawText.indexOf('{');
  const endIndex = rawText.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error("Failed to find a valid JSON object in the AI response.");
  }
  const text = rawText.substring(startIndex, endIndex + 1);

  if (!text) throw new Error("Gemini returned an empty response.");

  try {
    const jsonAnalysis = JSON.parse(text);
    const strengthMatrixFull = calculateCurrencyStrength(forexData);
    const tradeSetup = hotPairRaw ? calculateTradeLevels(hotPairRaw, hotPairAnalysis.effectiveBias) : undefined;

    const hotAlert: VolatilityAlert = {
        pair: hotPairAnalysis.symbol, deviation: hotPairAnalysis.pipDifference, bias: hotPairAnalysis.type === 'Bullish' ? 'Long' : 'Short', effectiveBias: hotPairAnalysis.effectiveBias,
        severity: hotPairAnalysis.pipDifference > 200 ? 'Extreme' : 'High', setupQuality: hotPairAnalysis.setupQuality, tradeSetup
    };
    
    const { suggestions, source } = generateDerivedPairs(hotAlert, strengthMatrixFull, activityMatrix);
    hotAlert.derivedPairs = suggestions;
    hotAlert.suggestionSource = source;
    
    const usdDashboardData = forexData.filter(p => p.symbol.includes('USD') && p.yearlyHigh > 0 && p.yearlyLow > 0)
      .map(p => {
          const analysis = rankedPairs.find(r => r.symbol === p.symbol);
          if (!analysis) return null;
          const yearlyRange = (p.yearlyHigh - p.yearlyLow) * getPipMultiplier(p.symbol);
          const progress = yearlyRange > 0 ? 100 - (analysis.yearlyPotentialPips / yearlyRange) * 100 : 0;
          return { pair: p.symbol, action: analysis.effectiveBias === 'Long' ? 'BUY' : 'SELL', potentialPips: analysis.yearlyPotentialPips, progress };
      }).filter((p): p is USDPotential => p !== null).sort((a, b) => a.progress - b.progress);

    const eurusdDerivedTrades = eurusdIndex ? generateTradeOpportunities(eurusdIndex, strengthMatrixFull) : [];
    const visualStrengthMatrix = strengthMatrixFull.filter(c => c.currency !== 'USD');
    
    return {
      rawMarketData: forexData, analysisTimestamp: new Date().toLocaleTimeString(), rankedPairs, hotPair: hotAlert,
      focusCurrency: jsonAnalysis.focusCurrency, focusCurrencyStrength: jsonAnalysis.focusCurrencyStrength,
      currencyStrengthRanking: visualStrengthMatrix, activityMatrix, usdDashboardData, aiReasoning: jsonAnalysis.aiReasoning,
      eurusdIndex, eurusdDerivedTrades,
      diagnostics
    };
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", text, e);
    throw new Error("AI analysis format was invalid.");
  }
};