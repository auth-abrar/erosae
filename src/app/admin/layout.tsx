'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_MODULE_REGISTRY } from '@/lib/modules';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  DollarSign,
  Languages,
  ShieldCheck,
  Truck,
  Building,
  BookOpen,
  Key,
  FileCheck,
  LogOut,
  ExternalLink,
  Store,
  Settings,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  DollarSign,
  Languages,
  ShieldCheck,
  Truck,
  Building,
  BookOpen,
  Key,
  FileCheck,
  Settings,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo & Portal Header */}
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <Link href="/admin" className="flex items-center space-x-2">
              <span className="text-xl font-black text-white font-serif tracking-tight">
                Erosae<span className="text-brand-500">.</span>
              </span>
              <span className="bg-brand-900/60 text-brand-400 border border-brand-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Platform
              </span>
            </Link>
            <Link
              href="/"
              target="_blank"
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
              title="View Storefront"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          {/* Module Navigation List */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Operations & ERP Modules
            </div>
            {ADMIN_MODULE_REGISTRY.map((mod) => {
              const IconComponent = ICON_MAP[mod.icon] || LayoutDashboard;
              const isActive =
                mod.route === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(mod.route);

              return (
                <Link
                  key={mod.id}
                  href={mod.route}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{mod.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-xs">
                M
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">Master Admin</p>
                <p className="text-[10px] text-gray-500">admin@erosae.com</p>
              </div>
            </div>
            <Link
              href="/"
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              title="Exit Admin"
            >
              <Store className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
