'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, CheckCircle2, RefreshCw } from 'lucide-react';

export default function OrderStatusUpdater({ order }: { order: any }) {
  const router = useRouter();
  const [orderStatus, setOrderStatus] = useState(order.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStatus,
          paymentStatus,
          trackingNumber,
        }),
      });

      if (!res.ok) throw new Error('Failed to update order status');

      setMessage('Order updated successfully!');
      router.refresh();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
        <Truck className="w-4 h-4 text-sky-400" />
        Order Fulfillment Status
      </h2>

      {message && (
        <div className="p-3 bg-slate-950 border border-slate-800 text-brand-300 text-xs rounded-xl">
          {message}
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block font-semibold text-slate-300 mb-1">Order Status</label>
          <select
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs focus:outline-none"
          >
            <option value="PENDING">PENDING (Awaiting Review)</option>
            <option value="CONFIRMED">CONFIRMED (Payment Verified)</option>
            <option value="PROCESSING">PROCESSING (Packing in warehouse)</option>
            <option value="SHIPPED">SHIPPED (In Transit with Courier)</option>
            <option value="DELIVERED">DELIVERED (Fulfilled)</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1">Payment Status</label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs focus:outline-none"
          >
            <option value="UNPAID">UNPAID</option>
            <option value="PAID">PAID</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1">Courier Tracking Number</label>
          <input
            type="text"
            placeholder="e.g. ARAMEX-987654321"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs font-mono focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isUpdating}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
        >
          {isUpdating ? 'Saving Changes...' : 'Update Order Status'}
        </button>
      </form>
    </div>
  );
}