'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  CreditCard,
  Sliders,
  ShieldCheck,
  Globe,
  Settings,
  ExternalLink,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();

  // If on login page, render full screen without layout sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/products', label: 'Products & CSV', icon: Package },
    { href: '/admin/categories', label: 'Categories Tree', icon: FolderTree },
    { href: '/admin/orders', label: 'Orders & Shipments', icon: ShoppingBag },
    { href: '/admin/payment-gateways', label: 'Payment Gateways', icon: CreditCard },
    { href: '/admin/custom-fields', label: 'Custom Fields Engine', icon: Sliders },
    { href: '/admin/staff', label: 'Staff & Roles (RBAC)', icon: ShieldCheck },
    { href: '/admin/currencies', label: 'Currency & FX Rates', icon: Globe },
    { href: '/admin/settings', label: 'Store Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex">
        <div className="p-6 space-y-6">
          {/* Logo */}
          <Link href="/admin" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              E
            </div>
            <div>
              <span className="font-['Cinzel'] text-lg font-bold tracking-widest text-white block">
                ERŌSAE
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                Admin Panel
              </span>
            </div>
          </Link>

          {/* Nav list */}
          <nav className="space-y-1 text-xs font-medium">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition ${
                    isActive
                      ? 'bg-brand-600 text-white font-semibold shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Store Preview */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/50">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Live Storefront</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-brand-400 flex items-center justify-center font-bold text-xs">
                {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="text-[11px] leading-tight truncate max-w-[110px]">
                <div className="text-white font-semibold truncate">{user?.name || 'Administrator'}</div>
                <div className="text-slate-500 font-mono text-[9px]">{user?.roleSlug || 'Super Admin'}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Merchant Management
            </span>
            <span className="text-slate-600">•</span>
            <span className="bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
              Hostinger MySQL Active
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              target="_blank"
              className="md:hidden text-xs text-brand-400 font-semibold"
            >
              View Store →
            </Link>
          </div>
        </header>

        {/* Sub-page content */}
        <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}