export const MAJOR_PAIRS = [
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'AUDUSD',
  'USDCAD',
  'USDCHF',
  'NZDUSD',
];

export const VALID_PAIRS = [
  // EUR Group
  'EURUSD', 'EURGBP', 'EURAUD', 'EURNZD', 'EURCAD', 'EURCHF', 'EURJPY',
  // GBP Group
  'GBPUSD', 'GBPAUD', 'GBPNZD', 'GBPCAD', 'GBPCHF', 'GBPJPY',
  // AUD Group
  'AUDUSD', 'AUDNZD', 'AUDCAD', 'AUDCHF', 'AUDJPY',
  // NZD Group
  'NZDUSD', 'NZDCAD', 'NZDCHF', 'NZDJPY',
  // USD Group (Remaining)
  'USDCAD', 'USDCHF', 'USDJPY',
  // CAD Group
  'CADCHF', 'CADJPY',
  // CHF Group
  'CHFJPY'
];

export const CSV_HEADERS = [
  'Pair', 
  'Price', 
  'Trend_Base',
  'Trend_Signal',
  'Weekly_High', 
  'Weekly_Low', 
  'Monthly_High', 
  'Monthly_Low',
  'Yearly_High',
  'Yearly_Low'
];

export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6a7u05eUAgSwT8l_CZy06JQ0Cqyk_PllkdW8XDtnvUl-nwdow3OFZ-PsZtOMGehUsdi2fcrbJxs9i/pub?gid=0&single=true&output=csv';

// Helper to determine pip multiplier
export const getPipMultiplier = (symbol: string): number => {
  if (symbol.includes('JPY')) return 100;
  // Commodities are no longer handled, but keeping for legacy safety in case a function still calls it
  if (['XAUUSD', 'XAGUSD', 'XPTUSD', 'USOIL', 'WTI'].includes(symbol)) return 100; 
  return 10000;
};