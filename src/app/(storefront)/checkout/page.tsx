'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Building2,
  Banknote,
  Lock,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalUSD, discountUSD, totalUSD, appliedCoupon, clearCart } = useCart();
  const { currentCurrency, formatPrice } = useCurrency();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('AE'); // Default UAE
  const [city, setCity] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill user details if logged in
  useEffect(() => {
    if (user) {
      if (user.email) setEmail(user.email);
      if (user.name) setFullName(user.name);
    }
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Your bag is empty</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Add some items to your bag before proceeding to checkout.
        </p>
        <Link
          href="/products"
          className="inline-block bg-slate-900 hover:bg-brand-600 text-white text-xs font-semibold px-6 py-3 rounded-full transition"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !fullName || !addressLine1 || !city) {
      setErrorMessage('Please complete all required shipping fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            title: i.title,
            quantity: i.quantity,
          })),
          customerEmail: email,
          customerName: fullName,
          customerPhone: phone,
          shippingAddress: {
            fullName,
            phone,
            countryCode,
            city,
            addressLine1,
            addressLine2,
            postalCode,
          },
          paymentMethod,
          currencyCode: currentCurrency,
          couponCode: appliedCoupon?.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed. Please try again.');
      }

      // Clear shopping bag
      clearCart();

      // Redirect according to driver instructions
      if (data.initiationResult?.redirectUrl) {
        window.location.href = data.initiationResult.redirectUrl;
      } else {
        router.push(`/order-confirmation/${data.orderNumber}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during checkout.');
      setIsSubmitting(false);
    }
  };

  const countries = [
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'OM', name: 'Oman' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'QA', name: 'Qatar' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'IN', name: 'India' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="pb-8 border-b border-slate-200">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
          Secure Checkout
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Finalize Your Order
        </h1>
      </div>

      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8">
        {/* Left Form: Customer & Shipping & Payment */}
        <div className="lg:col-span-7 space-y-8">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl">
              {errorMessage}
            </div>
          )}

          {/* 1. Contact Info */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-mono">1</span>
              Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Shipping Address */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-mono">2</span>
              Shipping Destination
            </h2>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Recipient Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tariq Al-Mansoor"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Country / Region *</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none font-medium text-slate-900"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Municipality *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Dubai / Riyadh / Dhaka"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Street Address & Villa/Apt *</label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Street name, Villa/Apartment/Building number"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apartment, Suite, Landmark (Optional)</label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Near City Center"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Postal / ZIP Code (Optional)</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="00000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-mono">3</span>
              Payment Method
            </h2>

            <div className="space-y-3">
              {/* Stripe Option */}
              <label
                className={`flex items-start p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'stripe'
                    ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="stripe"
                  checked={paymentMethod === 'stripe'}
                  onChange={() => setPaymentMethod('stripe')}
                  className="mt-1 mr-3 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Credit / Debit Card (Stripe Global)</span>
                    <CreditCard className="w-4 h-4 text-slate-600" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Visa, Mastercard, American Express, Apple Pay, and Google Pay supported.
                  </p>
                </div>
              </label>

              {/* COD Option */}
              <label
                className={`flex items-start p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'cod'
                    ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 mr-3 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</span>
                    <Banknote className="w-4 h-4 text-slate-600" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pay conveniently in cash or local card upon shipment delivery.
                  </p>
                </div>
              </label>

              {/* Bank Transfer Option */}
              <label
                className={`flex items-start p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'bank-transfer'
                    ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="bank-transfer"
                  checked={paymentMethod === 'bank-transfer'}
                  onChange={() => setPaymentMethod('bank-transfer')}
                  className="mt-1 mr-3 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Direct Bank Wire / Local Deposit</span>
                    <Building2 className="w-4 h-4 text-slate-600" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Transfer directly to our corporate bank account with order reference.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 hover:bg-brand-600 text-white font-semibold text-sm py-4 px-6 rounded-2xl flex items-center justify-center space-x-2 shadow-xl transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Order...</span>
              </div>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Complete Purchase • {formatPrice(totalUSD)}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Panel: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 sticky top-28 space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-4">
              Order Summary ({items.reduce((s, i) => s + i.quantity, 0)} Items)
            </h3>

            {/* Line items list */}
            <div className="divide-y divide-slate-200/80 max-h-72 overflow-y-auto pr-1">
              {items.map((it) => (
                <div key={it.id} className="py-3 flex gap-3 text-xs">
                  <img
                    src={it.image}
                    alt={it.title}
                    className="w-14 h-14 rounded-xl object-cover bg-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 line-clamp-1">{it.title}</div>
                    {it.variantTitle && (
                      <div className="text-[11px] text-slate-500">{it.variantTitle}</div>
                    )}
                    <div className="text-[11px] text-slate-500 mt-1">Qty: {it.quantity}</div>
                  </div>
                  <div className="font-bold text-slate-900">
                    {formatPrice(it.basePriceUSD * it.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 border-t border-slate-200 pt-4 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatPrice(subtotalUSD)}</span>
              </div>
              {discountUSD > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-{formatPrice(discountUSD)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Express Shipping</span>
                <span className="font-semibold text-slate-900">
                  {subtotalUSD >= 75 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    formatPrice(8.0)
                  )}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-bold text-slate-900">
                <span>Grand Total</span>
                <span className="text-brand-700 font-mono">{formatPrice(totalUSD)}</span>
              </div>
              <div className="text-[10px] text-slate-400 text-right">
                Billed in {currentCurrency} ({SUPPORTED_CURRENCIES[currentCurrency]?.name})
              </div>
            </div>

            {/* Guarantees */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Single-store merchant guaranteed stock</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>PCI-DSS Tokenized Encrypted Transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>Trackable Regional Courier Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}