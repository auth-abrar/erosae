import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatConvertedPrice } from '@/lib/currency';
import { Package, MapPin, User, LogOut, ArrowRight, Clock, ShieldCheck } from 'lucide-react';

export default async function CustomerAccountPage() {
  const session = await getSession();

  if (!session) {
    redirect('/account/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      },
      addresses: true,
    },
  });

  if (!user) {
    redirect('/account/login');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Profile Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-brand-50 text-brand-700 rounded-2xl flex items-center justify-center font-bold text-xl">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-xs text-slate-500">{user.email} • Customer Account</p>
          </div>
        </div>

        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>

      {/* Main Grid: Orders & Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Order History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-600" />
              Order History ({user.orders.length})
            </h2>
          </div>

          {user.orders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No orders placed yet</h3>
              <p className="text-xs text-slate-500">Your future purchases and tracking timelines will show up here.</p>
              <Link
                href="/products"
                className="inline-block bg-slate-900 hover:bg-brand-600 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition"
              >
                Browse Collections
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {user.orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center text-xs pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <span className="font-mono font-bold text-slate-900">#{ord.orderNumber}</span>
                      <span className="text-slate-400 ml-2">
                        {new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                        {ord.orderStatus}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${ord.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {ord.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    {ord.items.map((it) => (
                      <div key={it.id} className="flex justify-between">
                        <span>{it.quantity}x {it.title} {it.variantTitle && `(${it.variantTitle})`}</span>
                        <span className="font-mono font-semibold text-slate-900">{formatConvertedPrice(it.totalPrice, ord.currencyCode)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <div className="font-bold text-slate-900">
                      Total: {formatConvertedPrice(ord.totalAmount, ord.currencyCode)}
                    </div>
                    <Link
                      href={`/order-confirmation/${ord.orderNumber}`}
                      className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                    >
                      Track Order & Receipt →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Account Info */}
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-xs space-y-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider">Account Preferences</h3>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Preferred Currency:</span>
                <span className="font-bold text-slate-900">{user.preferredCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span>Account Status:</span>
                <span className="text-emerald-600 font-semibold">Active Customer</span>
              </div>
              <div className="flex justify-between">
                <span>Member Since:</span>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}