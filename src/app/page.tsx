'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { ProductCard } from '@/components/storefront/ProductCard';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Flame,
  ShieldCheck,
  TrendingUp,
  Package,
  Key,
  Shield,
  Truck,
  RotateCcw,
} from 'lucide-react';

export default function HomePage() {
  const { locale, t, formatPrice } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isBengali = locale === 'bn';

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products?featured=true').then((r) => r.json()),
          fetch('/api/categories').then((r) => r.json()),
        ]);

        if (prodRes.success) setProducts(prodRes.products);
        if (catRes.success) setCategories(catRes.categories);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-gray-900 to-black text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#d75a6a_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-900/60 border border-brand-500/30 text-xs font-semibold text-brand-300">
              <Sparkles className="w-3.5 h-3.5 text-gold-500 animate-pulse" />
              <span>{isBengali ? 'প্রিমিয়াম অনলাইন কমার্স প্ল্যাটফর্ম' : 'Premium Operating Commerce Platform'}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              {isBengali ? 'অভিজাত লাইফস্টাইল ও' : 'Curated Luxury &'} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-rose-300 to-gold-500">
                {isBengali ? 'প্রযুক্তির সেরা কালেকশন' : 'Digital Innovation'}
              </span>
            </h1>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-xl">
              {isBengali
                ? 'ইলেকট্রনিক্স, প্রিমিয়াম ফ্যাশন, অর্গানিক স্কিনকেয়ার এবং অথেনটিক ডিজিটাল সার্ভিস সাবস্ক্রিপশন পাচ্ছেন দেশজুড়ে দ্রুত ডেলিভারি ও শতভাগ নিরাপদ পেমেন্ট সুবিধায়।'
                : 'Discover studio-grade audio, tailored luxury apparel, pure botanical skincare, and official resale digital software suites with fast nationwide delivery.'}
            </p>

            <div className="pt-4 flex flex-wrap gap-4 items-center">
              <Link
                href="/products"
                className="px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white rounded-full font-bold text-sm transition-all duration-200 shadow-lg shadow-brand-600/30 flex items-center space-x-2"
              >
                <span>{t('hero.shop_now')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products?deals=true"
                className="px-6 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-full font-semibold text-sm transition"
              >
                {t('hero.view_deals')}
              </Link>
            </div>

            {/* Quick Trust Highlights */}
            <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-6 text-left">
              <div>
                <p className="text-2xl font-black text-white">100%</p>
                <p className="text-xs text-gray-400 mt-0.5">{isBengali ? 'জেনুইন প্রোডাক্ট' : 'Authentic Goods'}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-gold-500">BDT (৳)</p>
                <p className="text-xs text-gray-400 mt-0.5">{isBengali ? 'লোকাল ও গ্লোবাল কারেন্সি' : 'Multi-Currency Ready'}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-brand-400">২৪-৪৮ ঘণ্টা</p>
                <p className="text-xs text-gray-400 mt-0.5">{isBengali ? 'এক্সপ্রেস হোম ডেলিভারি' : 'Express Delivery'}</p>
              </div>
            </div>
          </div>

          {/* Hero Featured Showcase Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm rounded-3xl p-4 bg-gradient-to-b from-white/15 to-white/5 border border-white/20 backdrop-blur-xl shadow-2xl">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-800 relative">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
                  alt="Aura ANC Headphones"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {isBengali ? 'হট ডিল' : 'Featured Deal'}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-white text-base">
                  {isBengali
                    ? 'অরা সাউন্ড প্রো নয়েজ-ক্যানসেলিং হেডফোন'
                    : 'Aura Sound Pro ANC Wireless Headphones'}
                </h3>
                <p className="text-xs text-gray-300">
                  {isBengali
                    ? 'হাইব্রিড নয়েজ ক্যানসেলেশন ও ৪৫ ঘণ্টার ব্যাটারি'
                    : 'Studio-Grade Active Noise Cancellation & 45h Battery'}
                </p>
                <div className="flex justify-between items-center pt-2">
                  <p className="text-lg font-black text-gold-500">
                    {formatPrice(17500.0)}
                  </p>
                  <Link
                    href="/products/aura-wireless-headphones-pro"
                    className="px-4 py-2 bg-white text-gray-900 font-bold text-xs rounded-xl hover:bg-gray-100 transition"
                  >
                    {t('storefront.view_details')}
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Trust Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-start space-x-4">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{t('features.shipping_title')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('features.shipping_desc')}</p>
            </div>
          </div>

          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-start space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{t('features.payment_title')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('features.payment_desc')}</p>
            </div>
          </div>

          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-start space-x-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{t('features.returns_title')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('features.returns_desc')}</p>
            </div>
          </div>

          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-start space-x-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{isBengali ? 'ডিজিটাল ইনস্ট্যান্ট ডেলিভারি' : 'Instant Digital Access'}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{isBengali ? 'ইমেইল ও ড্যাশবোর্ডে সাথে সাথে অ্যাক্সেস' : 'Automated software keys & subscriptions'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {t('storefront.featured_categories')}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {isBengali
                ? 'পছন্দের ক্যাটাগরি থেকে সহজে কেনাকাটা করুন'
                : 'Explore our multi-category curated collections'}
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
          >
            <span>{isBengali ? 'সব ক্যাটাগরি' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-white border border-gray-100 p-5 shadow-sm hover:shadow-xl hover:border-brand-500/30 transition duration-300 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-gray-50 border-2 border-gray-100 group-hover:scale-105 transition duration-300">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'}
                  alt={isBengali ? cat.nameBn : cat.nameEn}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-bold text-sm text-gray-900 group-hover:text-brand-600 transition">
                {isBengali ? cat.nameBn : cat.nameEn}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                {cat._count?.products || 0} {isBengali ? 'টি পণ্য' : 'Items'}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Featured & Trending Products Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div className="flex items-center space-x-2">
            <Flame className="w-6 h-6 text-brand-600" />
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {t('storefront.trending_now')}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isBengali
                  ? 'গ্রাহকদের পছন্দের শীর্ষে থাকা জনপ্রিয় প্রোডাক্টস'
                  : 'Highest rated and most demanded merchandise this week'}
              </p>
            </div>
          </div>

          <Link
            href="/products"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
          >
            <span>{isBengali ? 'সবগুলো দেখুন' : 'Explore All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Promotional Coupon Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-brand-900 to-brand-700 text-white p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-2xl">
          <div className="space-y-4 max-w-lg z-10">
            <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full uppercase tracking-wider">
              {isBengali ? 'বিশেষ ডিসকাউন্ট' : 'Limited Time Offer'}
            </span>
            <h2 className="text-3xl font-black">
              {isBengali
                ? 'প্রথম অর্ডারে পান বিশেষ ১০% ছাড়'
                : 'Enjoy 10% Extra Discount on Your First Order'}
            </h2>
            <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
              {isBengali
                ? 'চেকআউটে প্রোমোকোড WELCOME10 ব্যবহার করুন এবং নিশ্চিত ক্যাশ অন ডেলিভারি বা অনলাইন পেমেন্টে দ্রুত হোম ডেলিভারি সুবিধা উপভোগ করুন।'
                : 'Use promo code WELCOME10 at checkout to unlock instant discounts with Cash on Delivery and multiple payment options.'}
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="px-6 py-3 bg-white text-brand-800 rounded-full font-bold text-xs hover:bg-gray-100 transition inline-flex items-center space-x-2"
              >
                <span>{isBengali ? 'কেনাকাটা করুন' : 'Claim Discount'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
