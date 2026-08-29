'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  Globe,
  Clock,
  ChevronRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Key,
  Database,
  Building,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [ordRes, prodRes] = await Promise.all([
          fetch('/api/orders').then((r) => r.json()),
          fetch('/api/products').then((r) => r.json()),
        ]);
        if (ordRes.success) setOrders(ordRes.orders);
        if (prodRes.success) setProducts(prodRes.products);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const totalSalesBDT = orders.reduce((acc, ord) => acc + (ord.totalAmountBDT || ord.totalAmount || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;
  const lowStockCount = products.reduce((acc, p) => {
    const hasLowStock = p.variants?.some((v: any) => v.stockQuantity <= 5);
    return acc + (hasLowStock ? 1 : 0);
  }, 0);

  const physicalCount = products.filter((p) => p.type === 'PHYSICAL').length;
  const digitalCount = products.filter((p) => p.type === 'DIGITAL' || p.type === 'LICENSE_KEY' || p.type === 'SUBSCRIPTION_SERVICE').length;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Erosae Business Operating Platform
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time Commerce, CRM, Inventory Warehousing, Couriers & General Ledger overview.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-600/20"
          >
            + Add Product
          </Link>
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl text-xs font-semibold transition"
          >
            Manage Orders ({orders.length})
          </Link>
        </div>
      </div>

      {/* KPI Metric Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales Revenue</span>
            <div className="p-2 bg-brand-950 text-brand-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {formatCurrency(totalSalesBDT, 'BDT')}
            </p>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1 mt-1">
              <span>Base BDT (৳) with Multi-Currency Settlement</span>
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 bg-blue-950 text-blue-400 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{orders.length}</p>
            <p className="text-[11px] text-amber-400 font-medium mt-1">
              {pendingOrdersCount} orders awaiting fulfillment
            </p>
          </div>
        </div>

        {/* Catalog Multi-Type */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalog Inventory</span>
            <div className="p-2 bg-purple-950 text-purple-400 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{products.length} Products</p>
            <p className="text-[11px] text-gray-400 font-medium mt-1">
              {physicalCount} Physical • {digitalCount} Digital / Subscriptions
            </p>
          </div>
        </div>

        {/* Warehouses & Couriers */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Fulfillment & Logistics</span>
            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white">2 Hubs Active</p>
            <p className="text-[11px] text-emerald-400 font-medium mt-1">
              Dhaka Hub & Port Logistics (Steadfast/Pathao)
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Recent Orders & Quick Module Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders Widget */}
        <div className="lg:col-span-8 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Recent Customer Orders</h2>
              <p className="text-xs text-gray-400">Latest store transactions requiring action</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-gray-500 py-8 text-center">No orders registered yet.</p>
          ) : (
            <div className="divide-y divide-gray-800 text-xs">
              {orders.slice(0, 5).map((ord) => (
                <div key={ord.id} className="py-3.5 flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-white">{ord.orderNumber}</span>
                      <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        {ord.paymentMethod}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {ord.guestName || 'Registered Customer'} • {formatCurrency(ord.totalAmountBDT || ord.totalAmount, 'BDT')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        ord.status === 'DELIVERED'
                          ? 'bg-emerald-950 text-emerald-400'
                          : ord.status === 'PROCESSING'
                          ? 'bg-blue-950 text-blue-400'
                          : 'bg-amber-950 text-amber-400'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Currency & Region Engine Status */}
        <div className="lg:col-span-4 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
          <div className="border-b border-gray-800 pb-4">
            <h2 className="text-base font-bold text-white">Active FX Engine</h2>
            <p className="text-xs text-gray-400">10 Supported Regional Currencies</p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-gray-800/60 rounded-xl">
              <div>
                <p className="font-bold text-white">BDT (৳)</p>
                <p className="text-[10px] text-emerald-400">Default Base Currency</p>
              </div>
              <span className="font-mono font-bold text-emerald-400">1.000 (Base)</span>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-gray-800/60 rounded-xl">
              <div>
                <p className="font-bold text-white">USD ($)</p>
                <p className="text-[10px] text-gray-400">US Dollar</p>
              </div>
              <span className="font-mono font-bold text-white">120.00 BDT</span>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-gray-800/60 rounded-xl">
              <div>
                <p className="font-bold text-white">SAR (﷼)</p>
                <p className="text-[10px] text-gray-400">Saudi Riyal</p>
              </div>
              <span className="font-mono font-bold text-gold-500">32.00 BDT</span>
            </div>

            <div className="flex justify-between items-center p-2.5 bg-gray-800/60 rounded-xl">
              <div>
                <p className="font-bold text-white">AED (د.إ)</p>
                <p className="text-[10px] text-gray-400">UAE Dirham</p>
              </div>
              <span className="font-mono font-bold text-white">32.70 BDT</span>
            </div>
          </div>

          <Link
            href="/admin/currencies"
            className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition text-center block"
          >
            Manage Exchange Rates
          </Link>
        </div>
      </div>
    </div>
  );
}
