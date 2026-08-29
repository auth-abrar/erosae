'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import {
  ShoppingBag,
  Search,
  Globe,
  DollarSign,
  User,
  Heart,
  Menu,
  X,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';

export function Header() {
  const {
    locale,
    setLocale,
    currency,
    setCurrency,
    t,
    cartCount,
    setIsCartOpen,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isBengali = locale === 'bn';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      {/* Top Announcement Bar */}
      <div className="bg-brand-900 text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <p className="font-medium truncate">
            {isBengali
              ? '✨ Erosae গ্র্যান্ড ওপেনিং অফার: প্রথম অর্ডারে ১০% ছাড় পান! কোড: EROSAE10'
              : '✨ Erosae Grand Opening: Get 10% OFF your first order! Use code: EROSAE10'}
          </p>
          <div className="flex items-center space-x-4">
            {/* Currency Selector */}
            <div className="flex items-center space-x-1">
              <DollarSign className="w-3.5 h-3.5 text-gold-500" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent text-xs text-gray-200 border-none outline-none cursor-pointer hover:text-white"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code} className="bg-gray-900 text-white">
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center space-x-1 border-l border-white/20 pl-3">
              <Globe className="w-3.5 h-3.5 text-gray-300" />
              <button
                onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
                className="hover:text-gold-500 font-medium transition"
              >
                {locale === 'en' ? 'বাংলা' : 'English'}
              </button>
            </div>

            {/* Admin Portal Link */}
            <Link
              href="/admin"
              className="text-gray-300 hover:text-white hidden md:inline-flex items-center space-x-1 border-l border-white/20 pl-3"
            >
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span>{t('nav.admin_panel')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-3xl font-black tracking-tight text-brand-700 font-serif">
                Erosae<span className="text-gold-500">.</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-6 text-sm font-semibold text-gray-700">
              <Link href="/" className="hover:text-brand-600 transition">
                {t('nav.home')}
              </Link>
              <Link href="/products" className="hover:text-brand-600 transition">
                {t('nav.all_products')}
              </Link>
              <Link href="/products?category=electronics" className="hover:text-brand-600 transition">
                {isBengali ? 'ইলেকট্রনিক্স' : 'Electronics'}
              </Link>
              <Link href="/products?category=fashion" className="hover:text-brand-600 transition">
                {isBengali ? 'ফ্যাশন' : 'Fashion'}
              </Link>
              <Link href="/products?category=home-living" className="hover:text-brand-600 transition">
                {isBengali ? 'গৃহসজ্জা' : 'Home'}
              </Link>
              <Link href="/products?category=beauty-health" className="hover:text-brand-600 transition">
                {isBengali ? 'বিউটি' : 'Beauty'}
              </Link>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.search_placeholder')}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
            </form>
          </div>

          {/* User & Cart Actions */}
          <div className="flex items-center space-x-4">
            <Link
              href="/account"
              className="p-2 text-gray-700 hover:text-brand-600 hover:bg-gray-50 rounded-full transition"
              title={t('nav.account')}
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-full transition flex items-center justify-center"
              aria-label={t('nav.cart')}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-brand-600 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-4">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('nav.search_placeholder')}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </form>

          <div className="flex flex-col space-y-3 font-medium text-gray-800">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-600">
              {t('nav.home')}
            </Link>
            <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-600">
              {t('nav.all_products')}
            </Link>
            <Link href="/products?category=electronics" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-600">
              {isBengali ? 'ইলেকট্রনিক্স ও গ্যাজেটস' : 'Electronics & Gadgets'}
            </Link>
            <Link href="/products?category=fashion" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-600">
              {isBengali ? 'ফ্যাশন ও পোশাক' : 'Fashion & Apparel'}
            </Link>
            <Link href="/products?category=home-living" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-600">
              {isBengali ? 'গৃহসজ্জা ও লাইফস্টাইল' : 'Home & Living'}
            </Link>
            <Link href="/products?category=beauty-health" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-600">
              {isBengali ? 'বিউটি ও পার্সোনাল কেয়ার' : 'Beauty & Personal Care'}
            </Link>
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="text-red-600 font-bold pt-2 border-t">
              {t('nav.admin_panel')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
