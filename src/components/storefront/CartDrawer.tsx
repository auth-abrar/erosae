'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateQuantity,
    cartSubtotalBDT,
    formatPrice,
    locale,
    t,
  } = useStore();

  const isBengali = locale === 'bn';

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-gray-900">{t('cart.title')}</h2>
              <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-800 text-base">{t('cart.empty')}</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  {t('cart.empty_subtitle')}
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-6 py-2.5 bg-brand-600 text-white rounded-full text-xs font-semibold hover:bg-brand-700 transition"
                >
                  {t('cart.continue_shopping')}
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex space-x-4 p-3 bg-gray-50/70 border border-gray-100 rounded-2xl"
                >
                  <div className="relative w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    <img
                      src={item.image}
                      alt={isBengali ? item.titleBn : item.titleEn}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-1">
                        {isBengali ? item.titleBn : item.titleEn}
                      </h4>
                      {item.variantNameEn && (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {isBengali ? item.variantNameBn : item.variantNameEn}
                        </p>
                      )}
                      <p className="text-xs font-bold text-brand-600 mt-1">
                        {formatPrice(item.priceBDT)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-gray-200 bg-white rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100 rounded-l"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100 rounded-r"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {cart.length > 0 && (
            <div className="border-t border-gray-100 p-6 bg-white space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">{t('cart.subtotal')}</span>
                <span className="text-base font-black text-gray-900">
                  {formatPrice(cartSubtotalBDT)}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {isBengali
                  ? 'শিপিং চার্জ ও প্রযোজ্য ট্যাক্স চেকআউটের সময় হিসাব করা হবে।'
                  : 'Shipping and applicable taxes calculated during checkout.'}
              </p>

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition flex items-center justify-center space-x-2 shadow-lg shadow-brand-600/20"
                >
                  <span>{t('cart.proceed_checkout')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2.5 bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 transition text-center block"
                >
                  {isBengali ? 'পুরো কার্ট দেখুন' : 'View Full Cart'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
