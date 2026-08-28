'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItemType {
  id: string; // unique key combining productId & variantId
  productId: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  sku: string;
  image: string;
  basePriceUSD: number; // Base USD price
  quantity: number;
  attributes?: Record<string, string>;
}

export interface AppliedCoupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_USD';
  discountValue: number;
}

interface CartContextType {
  items: CartItemType[];
  totalItemCount: number;
  subtotalUSD: number;
  discountUSD: number;
  totalUSD: number;
  appliedCoupon: AppliedCoupon | null;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItemType, 'id'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemType[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('erosae_cart');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
      const savedCoupon = localStorage.getItem('erosae_coupon');
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon));
      }
    } catch (err) {
      console.error('Error loading cart from storage:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('erosae_cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      if (appliedCoupon) {
        localStorage.setItem('erosae_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('erosae_coupon');
      }
    }
  }, [appliedCoupon, isLoaded]);

  const addItem = (newItem: Omit<CartItemType, 'id'>) => {
    const id = `${newItem.productId}_${newItem.variantId || 'default'}`;
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      } else {
        return [...prevItems, { ...newItem, id }];
      }
    });
    setIsCartDrawerOpen(true);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    localStorage.removeItem('erosae_cart');
    localStorage.removeItem('erosae_coupon');
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'WELCOME10') {
      const coupon: AppliedCoupon = { code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10 };
      setAppliedCoupon(coupon);
      return { success: true, message: '10% discount applied to your order!' };
    } else if (cleanCode === 'ERO25') {
      const coupon: AppliedCoupon = { code: 'ERO25', discountType: 'FIXED_USD', discountValue: 25 };
      setAppliedCoupon(coupon);
      return { success: true, message: '$25 discount applied!' };
    }
    return { success: false, message: 'Invalid or expired promo coupon code.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotalUSD = items.reduce(
    (sum, item) => sum + item.basePriceUSD * item.quantity,
    0
  );

  let discountUSD = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountUSD = (subtotalUSD * appliedCoupon.discountValue) / 100;
    } else {
      discountUSD = Math.min(appliedCoupon.discountValue, subtotalUSD);
    }
  }

  const totalUSD = Math.max(0, subtotalUSD - discountUSD);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItemCount,
        subtotalUSD,
        discountUSD,
        totalUSD,
        appliedCoupon,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}