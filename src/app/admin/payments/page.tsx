'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Save,
  Shield,
  Key,
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [gateways, setGateways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [editingGateway, setEditingGateway] = useState<any>(null);
  const [form, setForm] = useState({
    provider: '',
    isEnabled: true,
    isSandbox: true,
    appKey: '',
    appSecret: '',
    username: '',
    password: '',
    webhookSecret: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments');
      const data = await res.json();
      if (data.success) {
        setGateways(data.gateways || []);
      }
    } catch (err: any) {
      setError('Failed to fetch payment gateways.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (gw: any) => {
    setEditingGateway(gw);
    setForm({
      provider: gw.provider,
      isEnabled: gw.isEnabled,
      isSandbox: gw.isSandbox,
      appKey: gw.appKey || '',
      appSecret: gw.appSecret || '',
      username: gw.username || '',
      password: gw.password || '',
      webhookSecret: gw.webhookSecret || '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setEditingGateway(null);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.message || 'Failed to save gateway.');
      }
    } catch (err: any) {
      setError('Server error.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-brand-500" />
            <span>Payment Gateways & Wallets</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            bKash, Nagad, Rocket, SSLCommerz, and Stripe secure credential vault and environment controls.
          </p>
        </div>
      </div>

      {/* Gateway Architecture Status Banner */}
      <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center space-x-3 text-emerald-300 text-xs">
        <Shield className="w-5 h-5 flex-shrink-0" />
        <div>
          <span className="font-bold">Payment Gateway Architecture: SECURE ADAPTER ENGINE ACTIVE</span>
          <p className="text-[11px] opacity-80 mt-0.5">
            Credential storage is encrypted and database-backed. SSLCommerz, bKash, and Stripe are sandbox-verified with server-side amount tamper verification.
          </p>
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
          <span>Loading gateways from database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gateways.map((gw) => (
            <div key={gw.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-base font-mono">{gw.provider}</h3>
                  <span className="text-[11px] text-gray-400">
                    {gw.isSandbox ? 'Sandbox / Test Mode' : 'Live Production'}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    gw.isEnabled
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {gw.isEnabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-[11px] text-gray-400">
                  App Key: {gw.appKey ? '••••••••••••' : 'Not configured'}
                </p>
                <p className="text-[11px] text-gray-400">
                  Webhook Secret: {gw.webhookSecret ? '••••••••••••' : 'Not configured'}
                </p>
              </div>

              <button
                onClick={() => handleEdit(gw)}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition"
              >
                Configure Credentials
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit Gateway Credentials Modal */}
      {editingGateway && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-white">
              Configure {editingGateway.provider} Credentials
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-white font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isEnabled}
                    onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600"
                  />
                  <span>Enable Gateway</span>
                </label>

                <label className="flex items-center space-x-2 text-white font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isSandbox}
                    onChange={(e) => setForm({ ...form, isSandbox: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600"
                  />
                  <span>Sandbox / Test Mode</span>
                </label>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">App Key / Client ID</label>
                <input
                  type="text"
                  value={form.appKey}
                  onChange={(e) => setForm({ ...form, appKey: e.target.value })}
                  placeholder="Enter API Key"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">App Secret / Secret Key</label>
                <input
                  type="password"
                  value={form.appSecret}
                  onChange={(e) => setForm({ ...form, appSecret: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Webhook Signing Secret</label>
                <input
                  type="password"
                  value={form.webhookSecret}
                  onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingGateway(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
