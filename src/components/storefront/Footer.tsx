'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, RotateCcw, Headphones, Lock, Heart } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-brand-400 flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Express Regional Shipping</h4>
              <p className="text-xs text-slate-400 mt-0.5">Complimentary across GCC & South Asia on $75+</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">100% Authentic Products</h4>
              <p className="text-xs text-slate-400 mt-0.5">Directly sourced, curated luxury guarantee</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400 flex-shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Hassle-Free Returns</h4>
              <p className="text-xs text-slate-400 mt-0.5">14-day return window on eligible collections</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-sky-400 flex-shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Dedicated Concierge</h4>
              <p className="text-xs text-slate-400 mt-0.5">24/7 client care via chat & email support</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12 border-b border-slate-800 text-xs">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <span className="font-['Cinzel'] text-2xl font-bold tracking-widest text-white">
              ERŌSAE
            </span>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Erosae is a curated multi-category e-commerce destination connecting discerning shoppers with world-class electronics, luxury timepieces, pure Arabian Oud, and artisanal home accents.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>PCI-DSS Compliant & Encrypted Checkout</span>
            </div>
          </div>

          {/* Catalog */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Collections</h5>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/products?category=electronics-gadgets" className="hover:text-white transition">Electronics & Tech</Link></li>
              <li><Link href="/products?category=fashion-luxury" className="hover:text-white transition">Fashion & Luxury</Link></li>
              <li><Link href="/products?category=beauty-fragrances" className="hover:text-white transition">Oud & Fragrances</Link></li>
              <li><Link href="/products?category=home-living" className="hover:text-white transition">Home & Ceramics</Link></li>
              <li><Link href="/products?featured=true" className="hover:text-white transition">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Customer Care</h5>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/account" className="hover:text-white transition">Track My Order</Link></li>
              <li><Link href="/account" className="hover:text-white transition">Order History</Link></li>
              <li><Link href="/checkout" className="hover:text-white transition">Shipping Policy</Link></li>
              <li><Link href="/account" className="hover:text-white transition">Returns & Exchanges</Link></li>
              <li><Link href="/admin/login" className="hover:text-white text-slate-500 transition">Staff Portal</Link></li>
            </ul>
          </div>

          {/* Currencies Supported */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Supported Currencies</h5>
            <p className="text-[11px] text-slate-400">
              Automatic conversion and localized checkout in 10 currencies:
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.keys(SUPPORTED_CURRENCIES).map((c) => (
                <span
                  key={c}
                  className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} Erosae.com. All rights reserved. Single-store inventory.
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-slate-400">Privacy Policy</Link>
            <Link href="/" className="hover:text-slate-400">Terms of Service</Link>
            <Link href="/" className="hover:text-slate-400">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}