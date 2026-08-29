export interface CurrencyConfig {
  code: string;
  nameEn: string;
  nameBn: string;
  symbol: string;
  symbolPosition: 'BEFORE' | 'AFTER';
  decimalPlaces: number;
  exchangeRateToBDT: number; // 1 unit of foreign currency = X BDT (e.g. 1 USD = 120 BDT, so BDT = 1.0)
  isDefault?: boolean;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  BDT: {
    code: 'BDT',
    nameEn: 'Bangladeshi Taka',
    nameBn: 'বাংলাদেশী টাকা',
    symbol: '৳',
    symbolPosition: 'BEFORE',
    decimalPlaces: 2,
    exchangeRateToBDT: 1.0,
    isDefault: true,
  },
  USD: {
    code: 'USD',
    nameEn: 'US Dollar',
    nameBn: 'ইউএস ডলার',
    symbol: '$',
    symbolPosition: 'BEFORE',
    decimalPlaces: 2,
    exchangeRateToBDT: 120.0,
  },
  EUR: {
    code: 'EUR',
    nameEn: 'Euro',
    nameBn: 'ইউরো',
    symbol: '€',
    symbolPosition: 'BEFORE',
    decimalPlaces: 2,
    exchangeRateToBDT: 130.5,
  },
  GBP: {
    code: 'GBP',
    nameEn: 'British Pound',
    nameBn: 'ব্রিটিশ পাউন্ড',
    symbol: '£',
    symbolPosition: 'BEFORE',
    decimalPlaces: 2,
    exchangeRateToBDT: 154.0,
  },
  AED: {
    code: 'AED',
    nameEn: 'UAE Dirham',
    nameBn: 'সংযুক্ত আরব আমিরাত দিরহাম',
    symbol: 'د.إ',
    symbolPosition: 'AFTER',
    decimalPlaces: 2,
    exchangeRateToBDT: 32.7,
  },
  SAR: {
    code: 'SAR',
    nameEn: 'Saudi Riyal',
    nameBn: 'সৌদি রিয়াল',
    symbol: '﷼',
    symbolPosition: 'AFTER',
    decimalPlaces: 2,
    exchangeRateToBDT: 32.0,
  },
  QAR: {
    code: 'QAR',
    nameEn: 'Qatari Riyal',
    nameBn: 'কাতারি রিয়াল',
    symbol: '﷼',
    symbolPosition: 'AFTER',
    decimalPlaces: 2,
    exchangeRateToBDT: 33.0,
  },
  KWD: {
    code: 'KWD',
    nameEn: 'Kuwaiti Dinar',
    nameBn: 'কুয়েতি দিনার',
    symbol: 'د.ك',
    symbolPosition: 'AFTER',
    decimalPlaces: 3,
    exchangeRateToBDT: 392.0,
  },
  INR: {
    code: 'INR',
    nameEn: 'Indian Rupee',
    nameBn: 'ভারতীয় রুপি',
    symbol: '₹',
    symbolPosition: 'BEFORE',
    decimalPlaces: 2,
    exchangeRateToBDT: 1.43,
  },
};

/**
 * Converts a base BDT amount to the target currency.
 */
export function convertFromBDT(amountBDT: number, targetCurrencyCode: string, customRate?: number): number {
  if (isNaN(amountBDT) || amountBDT === 0) return 0;
  const config = SUPPORTED_CURRENCIES[targetCurrencyCode] || SUPPORTED_CURRENCIES.BDT;
  if (config.code === 'BDT') return amountBDT;

  const rateToBDT = customRate || config.exchangeRateToBDT;
  // target currency amount = amountBDT / rateToBDT
  const converted = amountBDT / rateToBDT;
  const factor = Math.pow(10, config.decimalPlaces);
  return Math.round(converted * factor) / factor;
}

/**
 * Converts a foreign currency amount back to base BDT.
 */
export function convertToBDT(amountForeign: number, sourceCurrencyCode: string, customRate?: number): number {
  if (isNaN(amountForeign) || amountForeign === 0) return 0;
  const config = SUPPORTED_CURRENCIES[sourceCurrencyCode] || SUPPORTED_CURRENCIES.BDT;
  if (config.code === 'BDT') return amountForeign;

  const rateToBDT = customRate || config.exchangeRateToBDT;
  const converted = amountForeign * rateToBDT;
  return Math.round(converted * 100) / 100;
}

/**
 * Formats a currency value with appropriate decimals and symbol with bilingual support.
 */
export function formatCurrency(
  amountBDT: number,
  currencyCode: string = 'BDT',
  locale: string = 'en',
  customRate?: number
): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.BDT;
  const converted = convertFromBDT(amountBDT, currencyCode, customRate);

  const formattedNumber = converted.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    minimumFractionDigits: config.code === 'BDT' ? 0 : config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  });

  if (config.symbolPosition === 'AFTER') {
    return `${formattedNumber} ${config.symbol}`;
  }
  return `${config.symbol}${formattedNumber}`;
}
