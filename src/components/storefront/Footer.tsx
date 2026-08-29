'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { ShieldCheck, Truck, RotateCcw, Headphones, Heart } from 'lucide-react';

export function Footer() {
  const { locale, t } = useStore();
  const isBengali = locale === 'bn';

  return (
    <footer className="bg-gray-950 text-gray-400 text-sm border-t border-gray-900">
      {/* Brand Value Highlights */}
      <div className="border-b border-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-brand-950/60 text-brand-500 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold">{t('features.shipping_title')}</h4>
              <p className="text-xs text-gray-500 mt-1">{t('features.shipping_desc')}</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 bg-brand-950/60 text-brand-500 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold">{t('features.payment_title')}</h4>
              <p className="text-xs text-gray-500 mt-1">{t('features.payment_desc')}</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 bg-brand-950/60 text-brand-500 rounded-xl">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold">{t('features.returns_title')}</h4>
              <p className="text-xs text-gray-500 mt-1">{t('features.returns_desc')}</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 bg-brand-950/60 text-brand-500 rounded-xl">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold">{t('features.support_title')}</h4>
              <p className="text-xs text-gray-500 mt-1">{t('features.support_desc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-5 gap-10">
        <div className="md:col-span-2 space-y-4">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-black text-white font-serif tracking-tight">
              Erosae<span className="text-gold-500">.</span>
            </span>
          </Link>
          <p className="text-xs leading-relaxed max-w-sm text-gray-400">
            {isBengali
              ? 'Erosae হলো একটি প্রিমিয়াম মাল্টি-ক্যাটাগরি মার্কেটপ্লেস। গ্রাহকদের সেরা মানের পণ্য এবং বিশ্বস্ত ডেলিভারি সেবা দেওয়াই আমাদের লক্ষ্য।'
              : 'Erosae is a curated multi-category general marketplace delivering premium lifestyle, tech, home, and fashion goods worldwide.'}
          </p>
          <div className="pt-2 text-xs text-gray-400 space-y-1">
            <p><strong>Email:</strong> support@erosae.com</p>
            <p><strong>Hotline:</strong> +880 9610-000000 / +971 4 000 0000</p>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
            {isBengali ? 'ক্যাটাগরি' : 'Categories'}
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link href="/products?category=electronics" className="hover:text-white transition">{isBengali ? 'ইলেকট্রনিক্স ও গ্যাজেটস' : 'Electronics & Gadgets'}</Link></li>
            <li><Link href="/products?category=fashion" className="hover:text-white transition">{isBengali ? 'ফ্যাশন ও পোশাক' : 'Fashion & Apparel'}</Link></li>
            <li><Link href="/products?category=home-living" className="hover:text-white transition">{isBengali ? 'গৃহসজ্জা ও লাইফস্টাইল' : 'Home & Living'}</Link></li>
            <li><Link href="/products?category=beauty-health" className="hover:text-white transition">{isBengali ? 'বিউটি ও পার্সোনাল কেয়ার' : 'Beauty & Health'}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
            {isBengali ? 'গ্রাহক সেবা' : 'Customer Care'}
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link href="/account" className="hover:text-white transition">{t('account.dashboard')}</Link></li>
            <li><Link href="/account" className="hover:text-white transition">{t('account.orders')}</Link></li>
            <li><Link href="/legal/shipping-policy" className="hover:text-white transition">{t('legal.shipping_policy')}</Link></li>
            <li><Link href="/legal/refund-policy" className="hover:text-white transition">{t('legal.refund_policy')}</Link></li>
            <li><Link href="/legal/contact" className="hover:text-white transition">{t('legal.contact_us')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
            {isBengali ? 'আইনি ও নীতিমালা' : 'Legal & Policies'}
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link href="/legal/about" className="hover:text-white transition">{t('legal.about_us')}</Link></li>
            <li><Link href="/legal/terms" className="hover:text-white transition">{t('legal.terms_conditions')}</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-white transition">{t('legal.privacy_policy')}</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar & Payment Gateways */}
      <div className="border-t border-gray-900/80 py-6 bg-black text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} Erosae.com. All rights reserved.</p>
          <div className="flex items-center space-x-3 text-gray-400 text-xs">
            <span className="bg-gray-900 px-2 py-1 rounded border border-gray-800">Visa / Mastercard</span>
            <span className="bg-gray-900 px-2 py-1 rounded border border-gray-800">Stripe</span>
            <span className="bg-gray-900 px-2 py-1 rounded border border-gray-800">bKash / Nagad</span>
            <span className="bg-gray-900 px-2 py-1 rounded border border-gray-800">Cash on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
