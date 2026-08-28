import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import {
  CheckCircle2,
  Package,
  Truck,
  Printer,
  ArrowRight,
  Clock,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { formatConvertedPrice } from '@/lib/currency';

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          product: {
            include: { images: { take: 1 } },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  let shippingAddress: any = {};
  try {
    shippingAddress = JSON.parse(order.shippingAddress);
  } catch {}

  const statuses = [
    { key: 'PENDING', label: 'Order Placed', desc: 'Order received and being verified' },
    { key: 'CONFIRMED', label: 'Confirmed', desc: 'Payment received and inventory allocated' },
    { key: 'PROCESSING', label: 'Processing', desc: 'Carefully packaged at fulfillment center' },
    { key: 'SHIPPED', label: 'Dispatched', desc: order.trackingNumber ? `Courier Tracking #${order.trackingNumber}` : 'In transit with regional courier' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Delivered to your destination' },
  ];

  const currentStatusIndex = Math.max(
    0,
    statuses.findIndex((s) => s.key === order.orderStatus)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
      {/* Thank You Header */}
      <div className="text-center space-y-3 bg-emerald-50/60 border border-emerald-200/80 p-8 rounded-3xl">
        <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          Order Successfully Placed
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Thank you, {order.guestName || 'Valued Customer'}!
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          We have dispatched a confirmation email to <span className="font-semibold text-slate-900">{order.guestEmail}</span> with your order details.
        </p>
        <div className="pt-2 font-mono text-xs bg-white inline-block px-4 py-1.5 rounded-full border border-emerald-200 text-slate-800 font-bold">
          Order #{order.orderNumber}
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-brand-600" />
          Fulfillment & Dispatch Timeline
        </h2>

        <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-6">
          {statuses.map((st, idx) => {
            const isCompleted = idx <= currentStatusIndex;
            const isCurrent = idx === currentStatusIndex;

            return (
              <div key={st.key} className="relative">
                {/* Circle node */}
                <div
                  className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3 h-3" />}
                </div>

                <div>
                  <div className={`text-xs font-bold ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                    {st.label} {isCurrent && <span className="bg-brand-100 text-brand-800 text-[10px] px-2 py-0.5 rounded-full ml-2">Active</span>}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {st.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Shipping & Payment summary */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-600" /> Shipping Destination
            </h3>
            <div className="text-slate-600 space-y-0.5">
              <div className="font-semibold text-slate-900">{shippingAddress.fullName || order.guestName}</div>
              <div>{shippingAddress.addressLine1}</div>
              {shippingAddress.addressLine2 && <div>{shippingAddress.addressLine2}</div>}
              <div>{shippingAddress.city}, {shippingAddress.countryCode}</div>
              <div>Phone: {shippingAddress.phone || order.guestPhone}</div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-brand-600" /> Payment Information
            </h3>
            <div className="text-slate-600 space-y-1">
              <div>Method: <span className="font-semibold uppercase text-slate-900">{order.paymentMethod}</span></div>
              <div>Payment Status: <span className={`font-semibold ${order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>{order.paymentStatus}</span></div>
            </div>
          </div>
        </div>

        {/* Right: Items & Totals */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-xs space-y-4">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
            Items in Order ({order.items.length})
          </h3>

          <div className="divide-y divide-slate-200 max-h-56 overflow-y-auto pr-1">
            {order.items.map((it) => (
              <div key={it.id} className="py-2.5 flex justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{it.title}</div>
                  {it.variantTitle && <div className="text-[11px] text-slate-500">{it.variantTitle}</div>}
                  <div className="text-slate-500 text-[10px]">Qty: {it.quantity} • SKU: {it.sku}</div>
                </div>
                <div className="font-bold text-slate-900 font-mono">
                  {formatConvertedPrice(it.totalPrice, order.currencyCode)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-3 space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatConvertedPrice(order.subtotalAmount, order.currencyCode)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount</span>
                <span>-{formatConvertedPrice(order.discountAmount, order.currencyCode)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span className="font-semibold text-slate-900">
                {order.shippingAmount === 0 ? 'FREE' : formatConvertedPrice(order.shippingAmount, order.currencyCode)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
              <span>Grand Total</span>
              <span className="text-brand-700 font-mono">{formatConvertedPrice(order.totalAmount, order.currencyCode)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <Link
          href="/products"
          className="bg-slate-900 hover:bg-brand-600 text-white font-semibold text-xs px-6 py-3 rounded-full transition flex items-center gap-2"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href={`/admin/orders/${order.id}/invoice`}
          target="_blank"
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-6 py-3 rounded-full transition flex items-center gap-2"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Official Receipt</span>
        </Link>
      </div>
    </div>
  );
}