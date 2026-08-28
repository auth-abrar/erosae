'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  User,
  ChevronDown,
  Globe,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  Truck,
  Heart,
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  children: Array<{ id: string; name: string; slug: string }>;
}

export default function Header() {
  const router = useRouter();
  const { currentCurrency, setCurrency, currencyConfig } = useCurrency();
  const { totalItemCount, setIsCartDrawerOpen } = useCart();
  const { user, isAdmin } = useAuth();

  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  // Fetch categories for mega menu
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(searchQuery)}&limit=5`)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data.products || []);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setIsCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-4">
          <div className="flex items-center space-x-2 text-center sm:text-left">
            <span className="bg-brand-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
              Global & Regional
            </span>
            <span className="text-slate-300">
              Complimentary Express Delivery across GCC & South Asia on orders over $75 USD
            </span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400 text-[11px]">
            {isAdmin && (
              <Link href="/admin" className="text-brand-400 hover:text-brand-300 font-medium">
                ⚡ Admin Panel
              </Link>
            )}
            <span className="hidden md:inline flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400 inline" /> 100% Authentic Guarantee
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:text-brand-600"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-['Cinzel'] text-2xl sm:text-3xl font-bold tracking-widest text-slate-900 hover:text-brand-700 transition">
              ERŌSAE
            </span>
          </Link>

          {/* Global Search Bar */}
          <div className="hidden md:block flex-1 max-w-lg relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search across all categories, brands, SKUs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 rounded-full border border-transparent focus:border-slate-300 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              {isSearching && (
                <div className="absolute right-4 top-3.5 w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              )}
            </form>

            {/* Instant Autocomplete Popover */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Products ({searchResults.length})
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {searchResults.map((prod) => (
                    <Link
                      key={prod.id}
                      href={`/products/${prod.slug}`}
                      onClick={() => setIsSearchFocused(false)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 transition"
                    >
                      <img
                        src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                        alt={prod.title}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {prod.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {prod.category?.name} • SKU: {prod.sku}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-brand-700">
                        ${prod.basePriceUSD.toFixed(2)}
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/products?q=${encodeURIComponent(searchQuery)}`}
                  onClick={() => setIsSearchFocused(false)}
                  className="block text-center py-2.5 text-xs font-medium text-brand-600 hover:bg-brand-50 border-t border-slate-100"
                >
                  View all results for "{searchQuery}" →
                </Link>
              </div>
            )}
          </div>

          {/* Action Tools: Currency Switcher, Account, Bag */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Currency Switcher Dropdown */}
            <div className="relative" ref={currencyRef}>
              <button
                type="button"
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                title="Change Currency"
              >
                <Globe className="w-3.5 h-3.5 text-slate-600" />
                <span>{currencyConfig.code} ({currencyConfig.symbol})</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {isCurrencyOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900">Select Display Currency</div>
                    <div className="text-[11px] text-slate-500">10 regional currencies supported</div>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-50">
                    {Object.values(SUPPORTED_CURRENCIES).map((curr) => {
                      const isSelected = curr.code === currentCurrency;
                      return (
                        <button
                          key={curr.code}
                          type="button"
                          onClick={() => {
                            setCurrency(curr.code);
                            setIsCurrencyOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-brand-50 text-brand-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold w-10">
                              {curr.code}
                            </span>
                            <span className="text-xs text-slate-600 truncate max-w-[120px]">
                              {curr.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {curr.decimalDigits === 3 && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">
                                3 Dec
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-900">
                              {curr.symbolNative || curr.symbol}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Account */}
            <Link
              href={user ? '/account' : '/account/login'}
              className="p-2 text-slate-700 hover:text-brand-600 rounded-full hover:bg-slate-100 transition relative"
              title={user ? `Signed in as ${user.name}` : 'Sign In'}
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Shopping Bag Button */}
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-brand-700 text-white px-3.5 py-2 rounded-full text-xs font-medium shadow-sm transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Bag</span>
              <span className="bg-brand-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-[20px] text-center">
                {totalItemCount}
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Category Mega-Nav Bar */}
        <nav className="hidden lg:flex items-center justify-between py-3 border-t border-slate-100 text-sm font-medium text-slate-700">
          <div className="flex items-center space-x-8">
            <Link href="/products" className="hover:text-brand-600 transition flex items-center gap-1 font-semibold text-slate-900">
              <Sparkles className="w-4 h-4 text-brand-600" /> All Categories
            </Link>
            {categories.map((cat) => (
              <div key={cat.id} className="relative group py-1">
                <Link
                  href={`/products?category=${cat.slug}`}
                  className="hover:text-brand-600 transition flex items-center gap-1"
                >
                  {cat.name}
                  {cat.children && cat.children.length > 0 && (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 transition" />
                  )}
                </Link>

                {/* Subcategory dropdown */}
                {cat.children && cat.children.length > 0 && (
                  <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 hidden group-hover:block z-50 animate-in fade-in duration-150">
                    {cat.children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/products?category=${sub.slug}`}
                        className="block px-4 py-2 text-xs text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-500">
            <Link href="/products?featured=true" className="hover:text-brand-600 text-rose-600 font-semibold">
              🔥 Featured Collections
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </form>

          <div className="space-y-2 pt-2">
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-semibold text-slate-900 hover:bg-slate-50"
            >
              Browse All Products
            </Link>
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-1">
                <Link
                  href={`/products?category=${cat.slug}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg font-medium text-slate-800 hover:bg-slate-50"
                >
                  {cat.name}
                </Link>
                {cat.children?.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/products?category=${sub.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block pl-6 pr-3 py-1.5 text-xs text-slate-600 hover:text-brand-600"
                  >
                    • {sub.name}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}