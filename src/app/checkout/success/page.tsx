'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { CheckCircle, Printer, ArrowRight, Package, Home, ShieldCheck, Download, Key } from 'lucide-react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const gateway = searchParams.get('gateway');
  const txId = searchParams.get('txId');

  const { locale, formatPrice, t } = useStore();
  const isBengali = locale === 'bn';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/orders?id=${orderId}`).then((r) => r.json());
        if (res.success && res.order) {
          setOrder(res.order);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId, gateway, txId]);

  const handlePrint = () => {
    window.print();
  };

  const address = order?.shippingAddressJson ? JSON.parse(order.shippingAddressJson) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Success Badge */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-sm text-center space-y-4 print:border-none print:shadow-none">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
          {t('checkout.order_success')}
        </h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          {t('checkout.order_success_msg')}
        </p>

        {order && (
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-block px-4 py-1.5 bg-gray-100 font-mono font-bold text-xs text-gray-800 rounded-full">
              {t('account.order_id')}: {order.orderNumber}
            </span>
            <span className="inline-block px-4 py-1.5 bg-brand-50 font-bold text-xs text-brand-700 rounded-full">
              {isBengali ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'} {order.paymentMethod}
            </span>
            <span className={`inline-block px-4 py-1.5 font-bold text-xs rounded-full ${
              order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {order.paymentStatus === 'PAID'
                ? isBengali ? 'পরিশোধিত (PAID)' : 'PAID'
                : isBengali ? 'অপেক্ষমান (PENDING)' : 'PENDING'}
            </span>
          </div>
        )}

        {/* Printable Bilingual Invoice Template */}
        {order && (
          <div className="border border-gray-200 rounded-2xl p-6 sm:p-8 text-left text-xs space-y-6 mt-8 bg-gray-50/50 print:bg-white print:border-gray-400">
            <div className="flex justify-between items-start border-b border-gray-200 pb-4">
              <div>
                <span className="text-2xl font-black text-brand-700 font-serif">
                  Erosae<span className="text-gold-500">.</span>
                </span>
                <p className="text-[11px] text-gray-500 mt-1">support@erosae.com | www.erosae.com</p>
                <p className="text-[11px] text-gray-400">Banani, Dhaka, Bangladesh</p>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider">
                  {isBengali ? 'অফিসিয়াল ট্যাক্স ইনভয়েস' : 'TAX INVOICE'}
                </h3>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString(isBengali ? 'bn-BD' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-gray-600 text-[11px] font-semibold mt-1">
                  Invoice #{order.orderNumber}
                </p>
              </div>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-2 gap-6 border-b border-gray-200 pb-4">
              <div>
                <p className="font-bold text-gray-700 mb-1">{isBengali ? 'গ্রাহকের বিবরণ' : 'Billed To'}:</p>
                <p className="font-bold text-gray-900">{order.guestName || address?.fullName}</p>
                <p className="text-gray-500">{order.guestEmail || address?.email || 'N/A'}</p>
                <p className="text-gray-500 font-mono">{order.guestPhone || address?.phone}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700 mb-1">{isBengali ? 'ডেলিভারি ঠিকানা' : 'Shipping Address'}:</p>
                <p className="text-gray-800">{address?.addressLine1}</p>
                {address?.addressLine2 && <p className="text-gray-800">{address?.addressLine2}</p>}
                <p className="text-gray-800 font-medium">{address?.city}, {address?.country}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                    <th className="py-2">{isBengali ? 'আইটেম বিবরণ' : 'Item Description'}</th>
                    <th className="py-2 text-center">{isBengali ? 'পরিমাণ' : 'Qty'}</th>
                    <th className="py-2 text-right">{isBengali ? 'একক মূল্য' : 'Unit Price'}</th>
                    <th className="py-2 text-right">{isBengali ? 'মোট' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-2.5 font-medium text-gray-800">
                        {isBengali ? item.titleBn : item.titleEn}
                        <span className="block text-[10px] text-gray-400 font-mono">SKU: {item.sku} ({item.productType})</span>
                      </td>
                      <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 text-right">{formatPrice(item.unitPriceBDT)}</td>
                      <td className="py-2.5 text-right font-bold">{formatPrice(item.totalPriceBDT)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="border-t border-gray-200 pt-3 space-y-1 text-right">
              <p className="text-gray-600">
                {t('cart.subtotal')}: <span className="font-bold text-gray-900">{formatPrice(order.subtotalAmountBDT)}</span>
              </p>
              {order.discountAmountBDT > 0 && (
                <p className="text-emerald-600 font-medium">
                  {isBengali ? 'ডিসকাউন্ট' : 'Discount'}: <span className="font-bold">-{formatPrice(order.discountAmountBDT)}</span>
                </p>
              )}
              <p className="text-gray-600">
                {t('cart.shipping_est')}: <span className="font-bold text-gray-900">{formatPrice(order.shippingAmountBDT)}</span>
              </p>
              <p className="text-base font-black text-brand-700 pt-2 border-t border-gray-200">
                {t('cart.total')}: {formatPrice(order.totalAmountBDT)}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 pt-6 print:hidden">
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-xs font-bold hover:bg-gray-800 transition flex items-center space-x-2 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>{isBengali ? 'ইনভয়েস প্রিন্ট / ডাউনলোড' : 'Print / Save Invoice'}</span>
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-brand-600 text-white rounded-full text-xs font-bold hover:bg-brand-700 transition flex items-center space-x-2 shadow"
          >
            <Home className="w-4 h-4" />
            <span>{isBengali ? 'হোমপেজে ফিরে যান' : 'Continue Shopping'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Loading order invoice...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
