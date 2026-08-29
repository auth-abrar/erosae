'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  Shield,
  FileText,
  Clock,
  ChevronRight,
  Eye,
  Key,
  Sparkles,
  Gift,
  Download,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export default function AccountPage() {
  const { locale, formatPrice, t } = useStore();
  const isBengali = locale === 'bn';

  const [activeTab, setActiveTab] = useState<'orders' | 'licenses' | 'subscriptions' | 'loyalty' | 'profile' | 'addresses'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrders(data.orders);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-14 h-14 bg-brand-50 text-brand-700 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm">
          <User className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            {t('account.dashboard')}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isBengali
              ? 'আপনার অর্ডার ট্র্যাকিং, ডিজিটাল লাইসেন্স কি, সাবস্ক্রিপশন ও রিওয়ার্ড পয়েন্ট'
              : 'Manage your purchases, digital licenses, subscriptions and loyalty rewards'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-white border border-gray-100 rounded-2xl p-2 shadow-sm space-y-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'orders'
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('account.orders')}</span>
            </button>

            <button
              onClick={() => setActiveTab('licenses')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'licenses'
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>{isBengali ? 'ডিজিটাল লাইসেন্স কি' : 'Digital License Keys'}</span>
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'subscriptions'
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isBengali ? 'সাবস্ক্রিপশন পাস' : 'Subscription Passes'}</span>
            </button>

            <button
              onClick={() => setActiveTab('loyalty')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'loyalty'
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>{isBengali ? 'লয়্যালটি ও কুপন' : 'Loyalty & Rewards'}</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'profile'
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t('account.profile')}</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'addresses'
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{t('account.addresses')}</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="lg:col-span-9">
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-gray-900">{t('account.orders')}</h2>

              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-20 bg-gray-100 rounded-2xl" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium">
                    {isBengali ? 'আপনার কোনো পূর্ববর্তী অর্ডার নেই।' : 'No orders placed yet.'}
                  </p>
                  <Link
                    href="/products"
                    className="mt-4 inline-block px-6 py-2.5 bg-brand-600 text-white rounded-full text-xs font-bold hover:bg-brand-700 transition"
                  >
                    {t('cart.continue_shopping')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="border border-gray-100 rounded-2xl p-4 sm:p-5 hover:border-gray-200 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-gray-900 font-mono">
                            {ord.orderNumber}
                          </span>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {ord.status}
                          </span>
                          <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {ord.paymentMethod}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(ord.createdAt).toLocaleDateString(
                              isBengali ? 'bn-BD' : 'en-US',
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            )}
                          </span>
                          <span>• {ord.items?.length || 1} items</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="font-black text-sm text-gray-900">
                          {formatPrice(ord.totalAmountBDT || ord.totalAmount)}
                        </span>
                        <Link
                          href={`/checkout/success?orderId=${ord.id}`}
                          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:text-brand-600 hover:border-brand-600 rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isBengali ? 'ইনভয়েস' : 'Invoice'}</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Licenses Tab */}
          {activeTab === 'licenses' && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <Key className="w-5 h-5 text-purple-600" />
                <span>{isBengali ? 'আপনার ডিজিটাল সফটওয়্যার লাইসেন্স কি' : 'Your Digital Software License Keys'}</span>
              </h2>
              <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-xs text-purple-950">Windows 11 Pro Retail (OEM Lifetime)</p>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded">ACTIVATED</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-purple-200 font-mono font-bold text-xs text-gray-900 flex justify-between items-center">
                  <span>W269N-WFGWX-YVC9B-4J6C9-T83GX</span>
                  <span className="text-[10px] text-gray-400">Order #ORD-ERO-1001</span>
                </div>
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>{isBengali ? 'আপনার ডিজিটাল সাবস্ক্রিপশন পাস' : 'Your Active Subscription Passes'}</span>
              </h2>
              <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-xs text-amber-950">Canva Pro 1-Year Educational Access</p>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded">ACTIVE (365 Days Warranty)</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {isBengali
                    ? 'আপনার একাউন্টে আমন্ত্রণ লিঙ্ক সফলভাবে সক্রিয় হয়েছে।'
                    : 'Invite link successfully sent and bound to customer email.'}
                </p>
              </div>
            </div>
          )}

          {/* Loyalty Rewards Tab */}
          {activeTab === 'loyalty' && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Erosae Rewards Club</h2>
                  <p className="text-xs text-gray-500">Earn 1 loyalty point for every ৳10 spent</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-gold-600">850 Points</span>
                  <p className="text-[10px] text-emerald-600 font-bold">Gold Tier Member</p>
                </div>
              </div>

              <div className="bg-brand-50/50 border border-brand-100 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-xs text-brand-900">Available Coupon: WELCOME10</p>
                  <p className="text-[11px] text-brand-700">10% discount on your next checkout</p>
                </div>
                <span className="bg-brand-600 text-white font-mono font-bold text-xs px-3 py-1.5 rounded-xl">
                  WELCOME10
                </span>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-gray-900">{t('account.profile')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue="Ruhul Amin"
                    className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-gray-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue="customer@erosae.com"
                    className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-gray-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    defaultValue="+880 1700 000000"
                    className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-gray-800 font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900">{t('account.addresses')}</h2>
              <div className="p-4 border border-dashed border-gray-300 rounded-2xl text-xs text-gray-600 space-y-1">
                <p className="font-bold text-gray-900">Default Shipping Address (Inside Dhaka)</p>
                <p>House 12, Road 4, Sector 7, Uttara, Dhaka, Bangladesh</p>
                <p className="font-mono text-gray-500">Contact: +880 1700 000000</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
