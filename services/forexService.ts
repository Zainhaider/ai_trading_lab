
import { ForexPairData } from '../types';

/**
 * DEPRECATED: Simulation logic removed.
 * The application now relies strictly on uploaded data from Google Sheets/CSV.
 */
export const fetchForexData = async (): Promise<ForexPairData[]> => {
  console.warn("fetchForexData called in Operational Mode - this should not happen.");
  return [];
};