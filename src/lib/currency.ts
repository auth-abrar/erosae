export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  symbolNative: string;
  decimalDigits: number;
  defaultRate: number;
  isBase?: boolean;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', symbolNative: '$', decimalDigits: 2, defaultRate: 1.0, isBase: true },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', symbolNative: 'د.إ', decimalDigits: 2, defaultRate: 3.6725 },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', symbolNative: 'ر.س', decimalDigits: 2, defaultRate: 3.7510 },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', symbolNative: 'د.ك', decimalDigits: 3, defaultRate: 0.3075 },
  OMR: { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', symbolNative: 'ر.ع', decimalDigits: 3, defaultRate: 0.3845 },
  BHD: { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', symbolNative: '.د.ب', decimalDigits: 3, defaultRate: 0.3770 },
  QAR: { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR', symbolNative: 'ر.ق', decimalDigits: 2, defaultRate: 3.6415 },
  BDT: { code: 'BDT', name: 'Bangladeshi Taka', symbol: 'BDT', symbolNative: '৳', decimalDigits: 2, defaultRate: 120.50 },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', symbolNative: '₹', decimalDigits: 2, defaultRate: 86.80 },
  PKR: { code: 'PKR', name: 'Pakistani Rupee', symbol: 'PKR', symbolNative: '₨', decimalDigits: 2, defaultRate: 278.40 },
};

export const DEFAULT_CURRENCY_CODE = 'USD';

/**
 * Converts USD base price to target currency amount
 */
export function convertFromUSD(
  amountUSD: number,
  currencyCode: string,
  exchangeRates?: Record<string, number>
): number {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const rate = exchangeRates?.[currencyCode] ?? config.defaultRate;
  const converted = amountUSD * rate;
  
  // Round to appropriate decimal places
  const factor = Math.pow(10, config.decimalDigits);
  return Math.round(converted * factor) / factor;
}

/**
 * Converts target currency amount back to USD base price
 */
export function convertToUSD(
  amount: number,
  currencyCode: string,
  exchangeRates?: Record<string, number>
): number {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const rate = exchangeRates?.[currencyCode] ?? config.defaultRate;
  if (!rate || rate === 0) return amount;
  return Math.round((amount / rate) * 10000) / 10000;
}

/**
 * Format currency with exact decimal precision (2 or 3 decimals)
 * e.g. 1.250 KD, 120.50 AED, $49.00
 */
export function formatCurrency(
  amountUSD: number,
  currencyCode: string = 'USD',
  exchangeRates?: Record<string, number>,
  useNativeSymbol: boolean = false
): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const amount = convertFromUSD(amountUSD, currencyCode, exchangeRates);
  const symbol = useNativeSymbol ? config.symbolNative : config.symbol;
  
  const formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimalDigits,
    maximumFractionDigits: config.decimalDigits,
  });

  if (currencyCode === 'USD') {
    return `${symbol}${formattedNumber}`;
  }
  
  return `${symbol} ${formattedNumber}`;
}

/**
 * Format pre-converted price
 */
export function formatConvertedPrice(
  amountInCurrency: number,
  currencyCode: string = 'USD',
  useNativeSymbol: boolean = false
): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const symbol = useNativeSymbol ? config.symbolNative : config.symbol;
  
  const formattedNumber = amountInCurrency.toLocaleString('en-US', {
    minimumFractionDigits: config.decimalDigits,
    maximumFractionDigits: config.decimalDigits,
  });

  if (currencyCode === 'USD') {
    return `${symbol}${formattedNumber}`;
  }
  
  return `${symbol} ${formattedNumber}`;
}