/**
 * Digital Heroes — Dual Currency (INR & USD) Formatting Utilities
 * Standard Exchange Rate: 1 USD = 83 INR (1 INR = ~0.012048 USD)
 */

export const INR_TO_USD_RATE = 1 / 83; // ~0.01204819277

export type CurrencyMode = 'dual' | 'inr' | 'usd';

export interface FormatOptions {
  showDecimals?: boolean;
  compact?: boolean;
  bracketUSD?: boolean;
  prefix?: string;
  suffix?: string;
}

/**
 * Formats a number in Indian Rupees (₹) using the Indian numbering system (lakhs/crores) or standard commas.
 */
export function formatINR(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  
  const hasFractions = amount % 1 !== 0;
  const decimals = showDecimals ? 2 : hasFractions ? 2 : 0;
  
  return '₹' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Converts INR to USD and formats as US Dollars ($).
 */
export function formatUSD(amountInINR: number, showDecimals?: boolean): string {
  if (isNaN(amountInINR) || amountInINR === null || amountInINR === undefined) return '$0';
  
  const usdAmount = amountInINR * INR_TO_USD_RATE;
  const hasFractions = usdAmount % 1 !== 0;
  const decimals = showDecimals !== undefined 
    ? (showDecimals ? 2 : 0) 
    : (usdAmount < 100 ? 2 : hasFractions ? 2 : 0);
  
  return '$' + usdAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Returns formatted dual currency representation: e.g. "₹50,000 ($602.41)" or "₹999 ($12.04)".
 */
export function formatDual(amountInINR: number, options: FormatOptions = {}): string {
  const inrStr = formatINR(amountInINR, options.showDecimals);
  const usdStr = formatUSD(amountInINR, options.showDecimals);
  
  if (options.bracketUSD === false) {
    return `${inrStr} / ${usdStr}`;
  }
  return `${inrStr} (${usdStr})`;
}

/**
 * Universal money formatter respecting the active currency display mode.
 */
export function formatMoney(
  amountInINR: number,
  mode: CurrencyMode = 'dual',
  options: FormatOptions = {}
): string {
  if (mode === 'inr') {
    return formatINR(amountInINR, options.showDecimals);
  }
  if (mode === 'usd') {
    return formatUSD(amountInINR, options.showDecimals);
  }
  return formatDual(amountInINR, options);
}

/**
 * Helper to get separate INR and USD parts for custom component rendering.
 */
export function getMoneyParts(amountInINR: number, showDecimals: boolean = false) {
  return {
    inr: formatINR(amountInINR, showDecimals),
    usd: formatUSD(amountInINR, showDecimals),
    usdValue: Number((amountInINR * INR_TO_USD_RATE).toFixed(2)),
  };
}
