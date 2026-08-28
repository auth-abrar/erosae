import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { ShoppingBag, Eye, Printer } from 'lucide-react';
import { formatConvertedPrice } from '@/lib/currency';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders & Shipments</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Process incoming orders, manage payment status, update tracking numbers, and issue invoices.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold">
                <th className="p-4">Order #</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Order Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4 text-right">Total Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No orders placed yet. Place an order on the storefront to test!
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono font-bold text-white">
                      #{ord.orderNumber}
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{ord.guestName || 'Guest'}</div>
                      <div className="text-slate-500 text-[10px]">{ord.guestEmail}</div>
                    </td>
                    <td className="p-4 uppercase font-mono text-[10px] text-slate-400">
                      {ord.paymentMethod}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ord.paymentStatus === 'PAID' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-white">
                      {formatConvertedPrice(ord.totalAmount, ord.currencyCode)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg transition"
                          title="Manage Order"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/orders/${ord.id}/invoice`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition"
                          title="Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}