import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { formatConvertedPrice } from '@/lib/currency';
import InvoicePrintButton from './InvoicePrintButton';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderInvoicePage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
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
    <div className="bg-white min-h-screen text-slate-900 p-8 sm:p-12 font-sans max-w-4xl mx-auto space-y-8" id="printable-invoice">
      <div className="flex justify-between items-start pb-6 border-b border-slate-200">
        <div>
          <span className="font-['Cinzel'] text-3xl font-bold tracking-widest text-slate-900 block">
            ERŌSAE
          </span>
          <p className="text-xs text-slate-500 mt-1">Curated Global Living & Modern Luxury</p>
          <p className="text-xs text-slate-500">Dubai Design District, UAE • concierge@erosae.com</p>
        </div>

        <div className="text-right space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">COMMERCIAL INVOICE</h1>
          <div className="font-mono text-sm font-bold text-brand-700">#{order.orderNumber}</div>
          <div className="text-xs text-slate-500">Date: {new Date(order.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 text-xs">
        <div>
          <h3 className="font-bold text-slate-500 uppercase tracking-wider mb-2">Billed & Shipped To:</h3>
          <div className="text-slate-800 space-y-0.5 font-medium">
            <div className="font-bold text-sm text-slate-900">{shippingAddress.fullName || order.guestName}</div>
            <div>{shippingAddress.addressLine1}</div>
            {shippingAddress.addressLine2 && <div>{shippingAddress.addressLine2}</div>}
            <div>{shippingAddress.city}, {shippingAddress.countryCode}</div>
            <div>Email: {order.guestEmail}</div>
            <div>Phone: {shippingAddress.phone || order.guestPhone}</div>
          </div>
        </div>

        <div className="text-right space-y-1 text-slate-600">
          <div><span className="font-semibold text-slate-900">Payment Method:</span> <span className="uppercase">{order.paymentMethod}</span></div>
          <div><span className="font-semibold text-slate-900">Payment Status:</span> <span className="uppercase">{order.paymentStatus}</span></div>
          <div><span className="font-semibold text-slate-900">Fulfillment Status:</span> <span className="uppercase">{order.orderStatus}</span></div>
          {order.trackingNumber && (
            <div><span className="font-semibold text-slate-900">Tracking #:</span> <span className="font-mono">{order.trackingNumber}</span></div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
        <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
          <tr>
            <th className="p-3">SKU</th>
            <th className="p-3">Item Description</th>
            <th className="p-3 text-center">Qty</th>
            <th className="p-3 text-right">Unit Price</th>
            <th className="p-3 text-right">Total ({order.currencyCode})</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {order.items.map((it) => (
            <tr key={it.id}>
              <td className="p-3 font-mono text-slate-600">{it.sku}</td>
              <td className="p-3 font-semibold text-slate-900">
                {it.title} {it.variantTitle && <span className="text-slate-500 font-normal">({it.variantTitle})</span>}
              </td>
              <td className="p-3 text-center">{it.quantity}</td>
              <td className="p-3 text-right font-mono">{formatConvertedPrice(it.unitPrice, order.currencyCode)}</td>
              <td className="p-3 text-right font-mono font-bold text-slate-900">{formatConvertedPrice(it.totalPrice, order.currencyCode)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end pt-4">
        <div className="w-64 space-y-1.5 text-xs text-slate-600 border-t border-slate-200 pt-3">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold text-slate-900">{formatConvertedPrice(order.subtotalAmount, order.currencyCode)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount ({order.couponCode}):</span>
              <span className="font-mono">-{formatConvertedPrice(order.discountAmount, order.currencyCode)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping & Handling:</span>
            <span className="font-mono font-semibold text-slate-900">{order.shippingAmount === 0 ? 'FREE' : formatConvertedPrice(order.shippingAmount, order.currencyCode)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
            <span>Total Paid / Due:</span>
            <span className="font-mono text-brand-800">{formatConvertedPrice(order.totalAmount, order.currencyCode)}</span>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-200 text-center text-xs text-slate-400 space-y-1">
        <p>Thank you for choosing Erosae. Single-store merchant inventory guarantee.</p>
        <p>For any inquiries regarding this shipment, please contact concierge@erosae.com.</p>
      </div>

      <div className="no-print pt-4 flex justify-center">
        <InvoicePrintButton />
      </div>
    </div>
  );
}