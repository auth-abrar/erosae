'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Shield,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function AdminSubscriptionsPage() {
  const [pools, setPools] = useState<any[]>([]);
  const [digitalProducts, setDigitalProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    productId: '',
    variantId: '',
    name: 'Standard Activation Key Vault',
    rawKeys: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions');
      const data = await res.json();
      if (data.success) {
        setPools(data.pools || []);
        setDigitalProducts(data.digitalProducts || []);
        if (data.digitalProducts?.length > 0) {
          setAddForm((prev) => ({
            ...prev,
            productId: data.digitalProducts[0].id,
            variantId: data.digitalProducts[0].variants?.[0]?.id || '',
          }));
        }
      } else {
        setError(data.message || 'Failed to load license pools.');
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

  const handleAddKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setShowAddModal(false);
        setAddForm({ ...addForm, rawKeys: '' });
        fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.message || 'Failed to inject keys.');
      }
    } catch (err: any) {
      setError(err.message || 'Server error.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Key className="w-6 h-6 text-brand-500" />
            <span>Digital Product License Vaults</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Resell third-party software, subscriptions, and AI memberships with automatic key fulfillment.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-brand-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add License Keys to Vault</span>
        </button>
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
          <span>Loading license vaults from database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pools.length === 0 ? (
            <div className="col-span-full py-16 bg-gray-900 border border-gray-800 rounded-3xl text-center text-xs text-gray-500">
              No digital license vaults created yet. Add a digital product key vault to get started.
            </div>
          ) : (
            pools.map((p) => {
              const availableKeys = p.keys?.filter((k: any) => !k.isUsed)?.length || 0;
              const usedKeys = p.keys?.filter((k: any) => k.isUsed)?.length || 0;
              return (
                <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-sm">{p.product?.titleEn || p.name}</h3>
                      <p className="text-[11px] text-gray-400 font-mono">SKU: {p.product?.sku}</p>
                    </div>
                    <span className="w-8 h-8 bg-brand-600/20 text-brand-400 rounded-xl flex items-center justify-center font-bold">
                      <Lock className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-gray-950/60 p-3 rounded-2xl border border-gray-800/80">
                      <p className="text-lg font-black text-emerald-400 font-mono">{availableKeys}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Keys In Stock</p>
                    </div>
                    <div className="bg-gray-950/60 p-3 rounded-2xl border border-gray-800/80">
                      <p className="text-lg font-black text-gray-400 font-mono">{usedKeys}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Keys Fulfilled</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-gray-400 text-[11px]">Vault Status: Auto-Dispatch Ready</p>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${(availableKeys / (availableKeys + usedKeys || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Keys Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-white">Add License Keys to Pool</h3>

            <form onSubmit={handleAddKeys} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Target Digital Product</label>
                <select
                  value={addForm.productId}
                  onChange={(e) => {
                    const prod = digitalProducts.find((p) => p.id === e.target.value);
                    setAddForm({
                      ...addForm,
                      productId: e.target.value,
                      variantId: prod?.variants?.[0]?.id || '',
                    });
                  }}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                >
                  {digitalProducts.map((dp) => (
                    <option key={dp.id} value={dp.id}>{dp.titleEn} ({dp.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">
                  Paste Raw License Keys (One per line)
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder={'KEY-1234-5678-ABCD\nKEY-8765-4321-DCBA\nKEY-9999-0000-WXYZ'}
                  value={addForm.rawKeys}
                  onChange={(e) => setAddForm({ ...addForm, rawKeys: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold"
                >
                  Inject Keys to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
