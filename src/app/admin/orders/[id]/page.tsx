import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import { ArrowLeft, Printer, Truck, CheckCircle2, CreditCard, MapPin } from 'lucide-react';
import { formatConvertedPrice } from '@/lib/currency';
import OrderStatusUpdater from './OrderStatusUpdater';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
      },
      payments: true,
    },
  });

  if (!order) {
    notFound();
  }

  let shippingAddress: any = {};
  try {
    shippingAddress = JSON.parse(order.shippingAddress);
  } catch {}

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/orders"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Order #{order.orderNumber}</h1>
            <p className="text-xs text-slate-400">
              Placed on {new Date(order.createdAt).toLocaleString()} • Billed in {order.currencyCode}
            </p>
          </div>
        </div>

        <Link
          href={`/admin/orders/${order.id}/invoice`}
          target="_blank"
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 border border-slate-700 transition"
        >
          <Printer className="w-4 h-4 text-sky-400" />
          <span>Print Invoice</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items & Pricing */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Ordered Items ({order.items.length})</h2>

            <div className="divide-y divide-slate-800">
              {order.items.map((it) => (
                <div key={it.id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">{it.title}</div>
                    {it.variantTitle && <div className="text-slate-400 text-[11px]">{it.variantTitle}</div>}
                    <div className="text-slate-500 text-[10px] font-mono">SKU: {it.sku} • Qty: {it.quantity}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-white">{formatConvertedPrice(it.totalPrice, order.currencyCode)}</div>
                    <div className="text-slate-500 text-[10px]">{formatConvertedPrice(it.unitPrice, order.currencyCode)} each</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-white">{formatConvertedPrice(order.subtotalAmount, order.currencyCode)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({order.couponCode})</span>
                  <span>-{formatConvertedPrice(order.discountAmount, order.currencyCode)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-mono text-white">{formatConvertedPrice(order.shippingAmount, order.currencyCode)}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
                <span>Total</span>
                <span className="text-brand-400 font-mono">{formatConvertedPrice(order.totalAmount, order.currencyCode)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 text-xs">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-400" /> Destination & Customer Details
            </h2>
            <div className="text-slate-300 space-y-1">
              <div className="font-bold text-white">{shippingAddress.fullName || order.guestName}</div>
              <div>{shippingAddress.addressLine1}</div>
              {shippingAddress.addressLine2 && <div>{shippingAddress.addressLine2}</div>}
              <div>{shippingAddress.city}, {shippingAddress.countryCode}</div>
              <div>Email: {order.guestEmail}</div>
              <div>Phone: {shippingAddress.phone || order.guestPhone}</div>
            </div>
          </div>
        </div>

        {/* Right Col: Interactive Status Updater */}
        <div>
          <OrderStatusUpdater order={order} />
        </div>
      </div>
    </div>
  );
}