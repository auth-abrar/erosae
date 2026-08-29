'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SUPPORTED_CURRENCIES, formatCurrency, convertFromBDT } from '@/lib/currency';
import { getDictionary, Locale } from '@/lib/i18n';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  titleEn: string;
  titleBn: string;
  image: string;
  priceBDT: number;
  sku: string;
  quantity: number;
  productType?: string;
  variantNameEn?: string;
  variantNameBn?: string;
}

interface StoreContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  currency: string;
  setCurrency: (curr: string) => void;
  t: (key: string) => string;
  dict: any;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>, qty?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  cartSubtotalBDT: number;
  cartCount: number;
  formatPrice: (amountBDT: number) => string;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  wishlist: string[]; // product IDs
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({
  children,
  initialLocale = 'en',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [currency, setCurrencyState] = useState<string>('BDT');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedLocale = localStorage.getItem('erosae_locale') as Locale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'bn')) {
      setLocaleState(savedLocale);
    }
    const savedCurrency = localStorage.getItem('erosae_currency');
    if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
      setCurrencyState(savedCurrency);
    }
    const savedCart = localStorage.getItem('erosae_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // Migration: ensure priceBDT is present
        const migrated = parsed.map((item: any) => ({
          ...item,
          priceBDT: item.priceBDT || (item.priceUSD ? item.priceUSD * 120 : 0),
        }));
        setCart(migrated);
      } catch (e) {
        console.error('Failed to parse saved cart');
      }
    }
    const savedWishlist = localStorage.getItem('erosae_wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Failed to parse saved wishlist');
      }
    }
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('erosae_cart', JSON.stringify(cart));
    }
  }, [cart, isMounted]);

  // Sync wishlist to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('erosae_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isMounted]);

  const setLocale = (newLoc: Locale) => {
    setLocaleState(newLoc);
    localStorage.setItem('erosae_locale', newLoc);
    document.cookie = `erosae_locale=${newLoc}; path=/; max-age=31536000`;
  };

  const setCurrency = (newCurr: string) => {
    setCurrencyState(newCurr);
    localStorage.setItem('erosae_currency', newCurr);
  };

  const dict = getDictionary(locale);

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = dict;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return path;
      }
    }
    return typeof current === 'string' ? current : path;
  };

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'>, qty = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += qty;
        return updated;
      }
      return [
        ...prev,
        {
          ...item,
          id: `${item.productId}-${item.variantId || 'base'}-${Date.now()}`,
          quantity: qty,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === cartItemId ? { ...i, quantity: qty } : i))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const cartSubtotalBDT = cart.reduce((acc, i) => acc + i.priceBDT * i.quantity, 0);
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const formatPrice = (amountBDT: number) => {
    return formatCurrency(amountBDT, currency, locale);
  };

  return (
    <StoreContext.Provider
      value={{
        locale,
        setLocale,
        currency,
        setCurrency,
        t,
        dict,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartSubtotalBDT,
        cartCount,
        formatPrice,
        isCartOpen,
        setIsCartOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
