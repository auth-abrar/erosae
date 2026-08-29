'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Tag,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Plus,
  Send,
  UserCheck,
  ShoppingBag,
  Gift,
} from 'lucide-react';

export default function AdminCrmPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'tickets' | 'coupons'>('customers');
  const [customers, setCustomers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponValue, setNewCouponValue] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
        setTickets(data.tickets || []);
        setCoupons(data.coupons || []);
      } else {
        setError(data.message || 'Failed to load CRM records.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage) return;

    try {
      const res = await fetch('/api/admin/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REPLY_TICKET',
          ticketId: selectedTicket.id,
          message: replyMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Reply sent to customer!');
        setReplyMessage('');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reply.');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_COUPON',
          couponCode: newCouponCode,
          discountType: 'PERCENTAGE',
          discountValue: newCouponValue,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Coupon created successfully!');
        setNewCouponCode('');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create coupon.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-brand-500" />
            <span>Customer Intelligence & Helpdesk</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Track customer order history, support ticket conversations, and promotional coupons.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-2 bg-gray-900 border border-gray-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'customers' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'tickets' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'coupons' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Coupons ({coupons.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-2xl text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center text-gray-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
          <span>Loading CRM records from database...</span>
        </div>
      ) : (
        <>
          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] border-b border-gray-800 pb-2">
                Customer Database Profiles
              </h2>

              <div className="divide-y divide-gray-800">
                {customers.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500">No customers registered yet.</div>
                ) : (
                  customers.map((c) => {
                    const totalSpent = c.orders?.reduce((sum: number, o: any) => sum + (o.totalAmountBDT || 0), 0) ?? 0;
                    return (
                      <div key={c.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm">{c.name}</span>
                            <span className="bg-brand-950 text-brand-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {c.customerProfile?.segment || 'CUSTOMER'}
                            </span>
                          </div>
                          <p className="text-gray-400 text-[11px]">
                            {c.email} • {c.phone || 'No phone'}
                          </p>
                        </div>

                        <div className="flex items-center space-x-4 text-right">
                          <div>
                            <span className="font-bold text-white text-xs">
                              ৳{totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <p className="text-[10px] text-gray-500">{c.orders?.length || 0} orders placed</p>
                          </div>
                          <span className="w-8 h-8 bg-gray-800 text-gray-300 rounded-xl flex items-center justify-center font-mono text-xs">
                            {c.loyaltyAccount?.pointsTotal || 0} pts
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] border-b border-gray-800 pb-2">
                  Support Ticket Queue
                </h2>

                <div className="divide-y divide-gray-800">
                  {tickets.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-500">No support tickets found.</div>
                  ) : (
                    tickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className={`p-3 rounded-2xl cursor-pointer transition ${
                          selectedTicket?.id === t.id ? 'bg-brand-600/10 border border-brand-500/30' : 'hover:bg-gray-800/30'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono font-bold text-brand-400">{t.ticketNumber}</span>
                          <span className="bg-amber-950 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {t.status}
                          </span>
                        </div>
                        <p className="font-bold text-white text-xs mt-1">{t.subject}</p>
                        <p className="text-[11px] text-gray-400">{t.user?.name || t.guestEmail || 'Guest'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Ticket Chat / Message Thread */}
              <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between min-h-[400px]">
                {selectedTicket ? (
                  <>
                    <div>
                      <div className="border-b border-gray-800 pb-3">
                        <h3 className="text-sm font-bold text-white">{selectedTicket.subject}</h3>
                        <p className="text-[11px] text-gray-400">
                          From: {selectedTicket.user?.name || selectedTicket.guestEmail} ({selectedTicket.ticketNumber})
                        </p>
                      </div>

                      <div className="space-y-3 py-4 max-h-[250px] overflow-y-auto">
                        {selectedTicket.messages?.map((m: any) => (
                          <div
                            key={m.id}
                            className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                              m.senderType === 'STAFF'
                                ? 'bg-brand-600 text-white ml-auto'
                                : 'bg-gray-800 text-gray-200'
                            }`}
                          >
                            <p className="font-bold text-[10px] opacity-75 mb-1">{m.senderType}</p>
                            <p>{m.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleSendReply} className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Type official support reply..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="flex-grow px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white text-xs font-medium"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="py-24 text-center text-xs text-gray-500">
                    Select a ticket from the queue to view messages and reply.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] border-b border-gray-800 pb-2">
                  Active Promotional Coupons
                </h2>

                <div className="divide-y divide-gray-800">
                  {coupons.map((cp) => (
                    <div key={cp.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono font-bold text-brand-400 bg-brand-950 px-2 py-0.5 rounded-md">
                          {cp.code}
                        </span>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {cp.discountType === 'PERCENTAGE' ? `${cp.discountValue}% OFF` : `৳${cp.discountValue} FLAT OFF`}
                        </p>
                      </div>
                      <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {cp.isActive ? 'ACTIVE' : 'EXPIRED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] border-b border-gray-800 pb-2">
                  Create Coupon Code
                </h2>

                <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Coupon Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SUMMER25"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Discount %</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(parseInt(e.target.value) || 10)}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition shadow-lg"
                  >
                    Generate Coupon
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
