'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Wallet,
  FileText,
  Sparkles,
} from 'lucide-react';

export default function CheckoutPage() {
  const { cart, cartSubtotalBDT, formatPrice, currency, clearCart, locale, t } = useStore();
  const router = useRouter();
  const isBengali = locale === 'bn';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Dhaka',
    state: 'Dhaka Division',
    postalCode: '',
    country: 'Bangladesh',
  });

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH' | 'NAGAD' | 'SSLCOMMERZ' | 'STRIPE'>('COD');
  const [customerNotes, setCustomerNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isInsideDhaka = formData.city.toLowerCase().includes('dhaka') || formData.addressLine1.toLowerCase().includes('dhaka');
  let shippingBDT = isInsideDhaka ? 70.0 : 130.0;
  if (cartSubtotalBDT >= 3000) {
    shippingBDT = 0.0; // Free shipping over ৳3,000
  }

  const totalBDT = cartSubtotalBDT + shippingBDT;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.addressLine1) {
      setError(isBengali ? 'দয়া করে প্রাপকের নাম, মোবাইল নম্বর এবং ঠিকানা পূরণ করুন।' : 'Please fill recipient name, phone number, and address.');
      return;
    }

    if (!termsAccepted) {
      setError(isBengali ? 'অর্ডার সম্পন্ন করতে অনুগ্রহ করে শর্তাবলী ও পলিসিতে সম্মতি দিন।' : 'Please accept terms & policies to place order.');
      return;
    }

    if (cart.length === 0) {
      setError(isBengali ? 'আপনার কার্ট খালি।' : 'Your cart is empty.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          shippingAddress: formData,
          paymentMethod,
          currencyCode: currency,
          customerNotes,
          acceptedPolicyVersions: ['TERMS_V1', 'PRIVACY_V1', 'RETURN_REFUND_V1'],
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to place order.');
      }

      clearCart();
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push(`/checkout/success?orderId=${data.order.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error processing order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center space-x-3 mb-8">
        <Lock className="w-6 h-6 text-brand-600" />
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          {t('checkout.title')}
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleOrderSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Customer & Delivery Information */}
        <div className="lg:col-span-7 space-y-8">
          {/* Shipping Address */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Truck className="w-5 h-5 text-brand-600" />
              <span>{t('checkout.shipping_address')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('checkout.full_name')} *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder={isBengali ? 'আপনার পূর্ণ নাম' : 'e.g. Tanvir Ahmed'}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('checkout.phone')} *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('checkout.email')} (ঐচ্ছিক / Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="customer@example.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('checkout.address_line1')} *
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  required
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  placeholder={isBengali ? 'বাড়ি নং, রোড নং, এলাকা/গ্রাম' : 'House 12, Road 4, Banani'}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('checkout.city')} / জেলা *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder={isBengali ? 'ঢাকা / চট্টগ্রাম / সিলেট' : 'Dhaka / Chattogram / Sylhet'}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('checkout.country')} *
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="Bangladesh">Bangladesh (বাংলাদেশ)</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="United States">United States</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-brand-600" />
              <span>{t('checkout.payment_method')}</span>
            </h2>

            <div className="space-y-3">
              {/* Cash on Delivery */}
              <label
                className={`flex items-start space-x-4 p-4 rounded-2xl border-2 cursor-pointer transition ${
                  paymentMethod === 'COD'
                    ? 'border-brand-600 bg-brand-50/50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-900">{t('checkout.cod')}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {isBengali ? 'জনপ্রিয়' : 'Nationwide COD'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{t('checkout.cod_desc')}</p>
                </div>
              </label>

              {/* bKash */}
              <label
                className={`flex items-start space-x-4 p-4 rounded-2xl border-2 cursor-pointer transition ${
                  paymentMethod === 'BKASH'
                    ? 'border-brand-600 bg-brand-50/50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="BKASH"
                  checked={paymentMethod === 'BKASH'}
                  onChange={() => setPaymentMethod('BKASH')}
                  className="mt-1 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-gray-900">
                    {isBengali ? 'বিকাশ অনলাইন পেমেন্ট (তাৎক্ষণিক)' : 'bKash Online Payment (Instant)'}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isBengali ? 'বিকাশ একাউন্ট বা পিন দিয়ে নিরাপদ পেমেন্ট' : 'Direct tokenized bKash checkout'}
                  </p>
                </div>
              </label>

              {/* Nagad */}
              <label
                className={`flex items-start space-x-4 p-4 rounded-2xl border-2 cursor-pointer transition ${
                  paymentMethod === 'NAGAD'
                    ? 'border-brand-600 bg-brand-50/50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="NAGAD"
                  checked={paymentMethod === 'NAGAD'}
                  onChange={() => setPaymentMethod('NAGAD')}
                  className="mt-1 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-gray-900">
                    {isBengali ? 'নগদ অনলাইন পেমেন্ট' : 'Nagad Gateway'}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isBengali ? 'নগদ ওয়ালেট দিয়ে তাৎক্ষণিক পেমেন্ট' : 'Direct Nagad payment'}
                  </p>
                </div>
              </label>

              {/* SSLCommerz Cards */}
              <label
                className={`flex items-start space-x-4 p-4 rounded-2xl border-2 cursor-pointer transition ${
                  paymentMethod === 'SSLCOMMERZ'
                    ? 'border-brand-600 bg-brand-50/50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="SSLCOMMERZ"
                  checked={paymentMethod === 'SSLCOMMERZ'}
                  onChange={() => setPaymentMethod('SSLCOMMERZ')}
                  className="mt-1 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-gray-900">
                    {isBengali ? 'ভিসা, মাস্টারকার্ড ও ইন্টারনেট ব্যাংকিং (SSLCommerz)' : 'Cards & Net Banking (SSLCommerz)'}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">Visa, Mastercard, DBBL Nexus & Internet Banking</p>
                </div>
              </label>

              {/* Stripe */}
              <label
                className={`flex items-start space-x-4 p-4 rounded-2xl border-2 cursor-pointer transition ${
                  paymentMethod === 'STRIPE'
                    ? 'border-brand-600 bg-brand-50/50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="STRIPE"
                  checked={paymentMethod === 'STRIPE'}
                  onChange={() => setPaymentMethod('STRIPE')}
                  className="mt-1 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-gray-900">
                    {isBengali ? 'আন্তর্জাতিক কার্ড (স্ট্রাইপ)' : 'International Credit Cards (Stripe)'}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">Global Visa, Mastercard, Apple Pay</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 sticky top-28">
            <h2 className="text-base font-bold text-gray-900">{t('checkout.order_summary')}</h2>

            {/* Item List */}
            <div className="max-h-60 overflow-y-auto space-y-3 divide-y divide-gray-50">
              {cart.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                    <div>
                      <p className="font-bold text-gray-900 line-clamp-1">
                        {isBengali ? item.titleBn : item.titleEn}
                      </p>
                      <p className="text-gray-400 text-[10px]">
                        Qty: {item.quantity} × {formatPrice(item.priceBDT)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-800">
                    {formatPrice(item.priceBDT * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>{t('cart.subtotal')}</span>
                <span className="font-bold text-gray-900">{formatPrice(cartSubtotalBDT)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>
                  {isInsideDhaka
                    ? isBengali
                      ? 'ডেলিভারি চার্জ (ঢাকা সিটি)'
                      : 'Delivery Charge (Inside Dhaka)'
                    : isBengali
                    ? 'ডেলিভারি চার্জ (ঢাকার বাইরে)'
                    : 'Delivery Charge (Outside Dhaka)'}
                </span>
                <span className="font-bold text-gray-900">
                  {shippingBDT === 0 ? (isBengali ? 'ফ্রি (৳৩,০০০+ অর্ডারে)' : 'Free (৳3,000+ promo)') : formatPrice(shippingBDT)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-100 pt-3">
                <span>{t('cart.total')} ({currency})</span>
                <span className="text-base text-brand-600">{formatPrice(totalBDT)}</span>
              </div>
            </div>

            {/* Policy Consent Checkbox */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-[11px] leading-relaxed">
                  {isBengali ? (
                    <>
                      আমি Erosae-এর{' '}
                      <Link href="/legal/terms-and-conditions" className="text-brand-600 font-bold underline" target="_blank">
                        শর্তাবলী
                      </Link>
                      ,{' '}
                      <Link href="/legal/privacy-policy" className="text-brand-600 font-bold underline" target="_blank">
                        গোপনীয়তা নীতি
                      </Link>{' '}
                      ও{' '}
                      <Link href="/legal/return-and-refund-policy" className="text-brand-600 font-bold underline" target="_blank">
                        রিটার্ন পলিসির
                      </Link>{' '}
                      সাথে সম্মত হচ্ছি।
                    </>
                  ) : (
                    <>
                      I agree to the{' '}
                      <Link href="/legal/terms-and-conditions" className="text-brand-600 font-bold underline" target="_blank">
                        Terms & Conditions
                      </Link>
                      ,{' '}
                      <Link href="/legal/privacy-policy" className="text-brand-600 font-bold underline" target="_blank">
                        Privacy Policy
                      </Link>
                      , and{' '}
                      <Link href="/legal/return-and-refund-policy" className="text-brand-600 font-bold underline" target="_blank">
                        Return Policy
                      </Link>
                      .
                    </>
                  )}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || cart.length === 0 || !termsAccepted}
              className={`w-full py-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 text-white shadow-xl transition ${
                loading || cart.length === 0 || !termsAccepted
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/25'
              }`}
            >
              {loading ? (
                <span>{t('checkout.processing')}</span>
              ) : (
                <>
                  <span>{t('checkout.place_order')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center space-x-2 text-[11px] text-gray-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isBengali ? 'নিরাপদ ১০০% মানিব্যাক গ্যারান্টি' : '100% Buyer Protection Guarantee'}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
