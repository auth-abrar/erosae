'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { Trash2, ArrowRight, ShoppingBag, Tag, ShieldCheck } from 'lucide-react';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartSubtotalBDT,
    formatPrice,
    locale,
    t,
  } = useStore();

  const isBengali = locale === 'bn';
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim().toUpperCase() === 'WELCOME10') {
      setAppliedCoupon('WELCOME10');
      setCouponError('');
    } else {
      setCouponError(isBengali ? 'অবৈধ কুপন কোড' : 'Invalid coupon code');
    }
  };

  const discountBDT = appliedCoupon ? cartSubtotalBDT * 0.1 : 0.0;
  const shippingBDT = cartSubtotalBDT >= 3000 || cart.length === 0 ? 0.0 : 70.0;
  const totalBDT = Math.max(0, cartSubtotalBDT + shippingBDT - discountBDT);

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">{t('cart.empty')}</h1>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">{t('cart.empty_subtitle')}</p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center space-x-2 px-8 py-3 bg-brand-600 text-white rounded-full text-xs font-bold hover:bg-brand-700 transition"
        >
          <span>{t('cart.continue_shopping')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-8">
        {t('cart.title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm divide-y divide-gray-100">
            {cart.map((item) => (
              <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-6">
                <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                  <img
                    src={item.image}
                    alt={isBengali ? item.titleBn : item.titleEn}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">
                        {isBengali ? item.titleBn : item.titleEn}
                      </h3>
                      {item.variantNameEn && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isBengali ? item.variantNameBn : item.variantNameEn}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 font-mono mt-1">SKU: {item.sku}</p>
                    </div>
                    <p className="font-black text-sm text-gray-900">
                      {formatPrice(item.priceBDT * item.quantity)}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <div className="flex items-center border border-gray-200 bg-white rounded-xl">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-l"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-r"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{isBengali ? 'মুছে ফেলুন' : 'Remove'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900">{t('checkout.order_summary')}</h2>

            {/* Coupon input */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700">
                {t('cart.coupon_code')}
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="WELCOME10"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs uppercase focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition"
                >
                  {t('cart.apply_coupon')}
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-[11px] text-emerald-600 font-semibold">
                  {isBengali ? '১০% ডিসকাউন্ট প্রয়োগ করা হয়েছে!' : '10% discount applied!'}
                </p>
              )}
              {couponError && <p className="text-[11px] text-rose-500">{couponError}</p>}
            </form>

            <div className="space-y-3 border-t border-gray-100 pt-4 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>{t('cart.subtotal')}</span>
                <span className="font-bold text-gray-900">{formatPrice(cartSubtotalBDT)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>{isBengali ? 'কুপন ডিসকাউন্ট (১০%)' : 'Discount (10%)'}</span>
                  <span>-{formatPrice(discountBDT)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>{t('cart.shipping_est')}</span>
                <span className="font-bold text-gray-900">
                  {shippingBDT === 0 ? (isBengali ? 'বিনামূল্যে' : 'Free') : formatPrice(shippingBDT)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-100 pt-3">
                <span>{t('cart.total')}</span>
                <span className="text-base text-brand-600">{formatPrice(totalBDT)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-xs hover:bg-brand-700 transition flex items-center justify-center space-x-2 shadow-lg shadow-brand-600/20"
            >
              <span>{t('cart.proceed_checkout')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center space-x-2 text-[11px] text-gray-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isBengali ? 'নিরাপদ এনক্রিপ্টেড চেকআউট' : '256-bit Encrypted Secure Checkout'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
