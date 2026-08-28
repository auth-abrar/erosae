import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import {
  ShoppingBag,
  DollarSign,
  Package,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Plus,
  FileSpreadsheet,
  Globe,
  Sliders,
} from 'lucide-react';
import { formatConvertedPrice } from '@/lib/currency';

async function getDashboardData() {
  const [
    totalOrdersCount,
    totalProductsCount,
    orders,
    recentOrders,
    lowStockVariants,
    currencies,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.order.findMany({ select: { totalAmountUSD: true, totalAmount: true, currencyCode: true } }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
    prisma.productVariant.findMany({
      where: { stockQuantity: { lte: 10 } },
      include: { product: true },
      take: 5,
    }),
    prisma.currency.findMany({ where: { isActive: true } }),
  ]);

  const grossSalesUSD = orders.reduce((sum, o) => sum + (o.totalAmountUSD || 0), 0);

  // Group revenue by currency
  const revenueByCurrency: Record<string, number> = {};
  for (const o of orders) {
    revenueByCurrency[o.currencyCode] = (revenueByCurrency[o.currencyCode] || 0) + o.totalAmount;
  }

  const pendingOrdersCount = await prisma.order.count({
    where: { orderStatus: 'PENDING' },
  });

  return {
    totalOrdersCount,
    totalProductsCount,
    grossSalesUSD,
    revenueByCurrency,
    pendingOrdersCount,
    recentOrders,
    lowStockVariants,
    currencies,
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Merchant Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time sales, multi-currency revenue metrics, and order fulfillment status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <Link
            href="/admin/products/new"
            className="bg-brand-600 hover:bg-brand-500 text-white px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
          <Link
            href="/admin/products"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl flex items-center space-x-1.5 border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>CSV Import / Export</span>
          </Link>
        </div>
      </div>

      {/* 1. KEY KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales USD */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
            <span>Gross Sales (USD Equivalent)</span>
            <div className="p-2 bg-emerald-950/60 text-emerald-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${data.grossSalesUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> 100% merchant-owned inventory
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
            <span>Total Orders Placed</span>
            <div className="p-2 bg-sky-950/60 text-sky-400 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {data.totalOrdersCount}
          </div>
          <div className="text-[11px] text-slate-400">
            {data.pendingOrdersCount} orders needing processing
          </div>
        </div>

        {/* Catalog SKUs */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
            <span>Active Products (Catalog)</span>
            <div className="p-2 bg-purple-950/60 text-purple-400 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {data.totalProductsCount}
          </div>
          <div className="text-[11px] text-purple-400">
            Ready for 100–1,000 launch SKUs
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
            <span>Low Stock Items</span>
            <div className="p-2 bg-amber-950/60 text-amber-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {data.lowStockVariants.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Variants with ≤ 10 units in stock
          </div>
        </div>
      </div>

      {/* 2. REVENUE BREAKDOWN BY REGIONAL CURRENCY & LOW STOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Currency */}
        <div className="lg:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-400" />
                Revenue Breakdown Across 10 Regional Currencies
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Amounts collected in customer's local currency.
              </p>
            </div>
            <Link
              href="/admin/currencies"
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              FX Rates →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
            {data.currencies.map((curr) => {
              const collectedAmount = data.revenueByCurrency[curr.code] || 0;
              return (
                <div key={curr.code} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-slate-300">{curr.code}</span>
                    {curr.decimalDigits === 3 && (
                      <span className="text-[9px] bg-amber-950 text-amber-300 px-1 py-0.2 rounded font-mono">
                        3 Dec
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono font-bold text-white">
                    {formatConvertedPrice(collectedAmount, curr.code)}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{curr.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Low Stock Warnings
            </h3>
            <Link href="/admin/products" className="text-xs text-brand-400 font-semibold">
              Manage →
            </Link>
          </div>

          {data.lowStockVariants.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              All SKUs are adequately stocked.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 text-xs">
              {data.lowStockVariants.map((v) => (
                <div key={v.id} className="py-2.5 flex justify-between items-center">
                  <div className="truncate max-w-[170px]">
                    <div className="text-white font-semibold truncate">{v.product.title}</div>
                    <div className="text-slate-500 text-[10px]">{v.title} • {v.sku}</div>
                  </div>
                  <span className="bg-rose-950/80 border border-rose-800 text-rose-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md">
                    {v.stockQuantity} Left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. RECENT ORDERS TABLE */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Customer Orders</h3>
            <p className="text-[11px] text-slate-400">Incoming orders across all 10 currencies.</p>
          </div>
          <Link href="/admin/orders" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">
            View All Orders →
          </Link>
        </div>

        {data.recentOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No orders placed yet. Test with the customer storefront!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Order Status</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3 text-right">Total Amount</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 font-mono font-bold text-white">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3.5">
                      <div className="text-slate-200 font-medium">{ord.guestName || 'Guest'}</div>
                      <div className="text-slate-500 text-[10px]">{ord.guestEmail}</div>
                    </td>
                    <td className="py-3.5 uppercase font-mono text-[10px] text-slate-400">
                      {ord.paymentMethod}
                    </td>
                    <td className="py-3.5">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ord.paymentStatus === 'PAID' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-white">
                      {formatConvertedPrice(ord.totalAmount, ord.currencyCode)}
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="text-brand-400 hover:text-brand-300 font-semibold"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}