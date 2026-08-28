'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY_CODE,
  formatCurrency,
  convertFromUSD,
  convertToUSD,
  CurrencyConfig,
} from '@/lib/currency';

interface CurrencyContextType {
  currentCurrency: string;
  currencyConfig: CurrencyConfig;
  exchangeRates: Record<string, number>;
  setCurrency: (code: string) => void;
  formatPrice: (amountUSD: number, useNativeSymbol?: boolean) => string;
  convertToCurrent: (amountUSD: number) => number;
  convertToBaseUSD: (amountInCurrent: number) => number;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currentCurrency, setCurrentCurrency] = useState<string>(DEFAULT_CURRENCY_CODE);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load persisted currency preference
    const saved = localStorage.getItem('erosae_currency');
    if (saved && SUPPORTED_CURRENCIES[saved]) {
      setCurrentCurrency(saved);
    }

    // Fetch live/stored rates from API
    fetch('/api/currencies')
      .then((res) => res.json())
      .then((data) => {
        if (data.rates) {
          setExchangeRates(data.rates);
        }
      })
      .catch((err) => console.error('Error loading currency rates:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSetCurrency = (code: string) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrentCurrency(code);
      localStorage.setItem('erosae_currency', code);
    }
  };

  const currencyConfig = SUPPORTED_CURRENCIES[currentCurrency] || SUPPORTED_CURRENCIES.USD;

  const formatPrice = (amountUSD: number, useNativeSymbol: boolean = false) => {
    return formatCurrency(amountUSD, currentCurrency, exchangeRates, useNativeSymbol);
  };

  const convertToCurrent = (amountUSD: number) => {
    return convertFromUSD(amountUSD, currentCurrency, exchangeRates);
  };

  const convertToBaseUSD = (amountInCurrent: number) => {
    return convertToUSD(amountInCurrent, currentCurrency, exchangeRates);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        currencyConfig,
        exchangeRates,
        setCurrency: handleSetCurrency,
        formatPrice,
        convertToCurrent,
        convertToBaseUSD,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}