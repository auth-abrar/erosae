'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Building2,
  TrendingDown,
  TrendingUp,
  History,
  Sliders,
} from 'lucide-react';

export default function AdminInventoryPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    warehouseId: '',
    productId: '',
    variantId: '',
    deltaQuantity: 10,
    reason: 'MANUAL_ADJUSTMENT',
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory');
      const data = await res.json();
      if (data.success) {
        setWarehouses(data.warehouses || []);
        setProducts(data.products || []);
        setTransactions(data.transactions || []);
        if (data.warehouses?.length > 0 && data.products?.length > 0) {
          setAdjustForm((prev) => ({
            ...prev,
            warehouseId: data.warehouses[0].id,
            productId: data.products[0].id,
            variantId: data.products[0].variants?.[0]?.id || '',
          }));
        }
      } else {
        setError(data.message || 'Failed to load inventory.');
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

  const handleProductSelect = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    setAdjustForm({
      ...adjustForm,
      productId: prodId,
      variantId: prod?.variants?.[0]?.id || '',
    });
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustForm),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setShowAdjustModal(false);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.message || 'Stock adjustment failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-brand-500" />
            <span>Warehouses & Multi-Location Stock</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time stock balances across regional fulfillment centers with auditable movement logs.
          </p>
        </div>

        <button
          onClick={() => setShowAdjustModal(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-brand-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Adjust Stock Levels</span>
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
          <span>Loading inventory from database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Warehouses Cards */}
          <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {warehouses.map((wh) => (
              <div key={wh.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="w-8 h-8 bg-brand-600/20 text-brand-400 rounded-xl flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {wh.isPrimary ? 'PRIMARY HUB' : 'ACTIVE'}
                  </span>
                </div>
                <h3 className="font-bold text-white text-xs">{wh.name}</h3>
                <p className="text-[11px] text-gray-400">{wh.city} • Code: {wh.code}</p>
              </div>
            ))}
          </div>

          {/* Product Stock Table */}
          <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] border-b border-gray-800 pb-2">
              Catalog Stock Overview ({products.length} Products)
            </h2>

            <div className="divide-y divide-gray-800">
              {products.map((prod) => {
                const totalStock = prod.variants?.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0) ?? 0;
                return (
                  <div key={prod.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{prod.titleEn}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        SKU: {prod.sku} • {prod.category?.nameEn}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded-lg text-xs ${
                          totalStock < 10
                            ? 'bg-rose-950 text-rose-300'
                            : 'bg-emerald-950 text-emerald-300'
                        }`}
                      >
                        {totalStock} units
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Auditable Stock Movement Logs */}
          <div className="lg:col-span-5 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] border-b border-gray-800 pb-2 flex items-center space-x-2">
              <History className="w-4 h-4 text-brand-500" />
              <span>Auditable Stock Transactions</span>
            </h2>

            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  No stock transactions recorded yet.
                </div>
              ) : (
                transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="p-3 bg-gray-950/60 border border-gray-800/80 rounded-2xl space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-[11px]">
                        {tx.inventoryItem?.product?.titleEn || 'Product'}
                      </span>
                      <span
                        className={`font-mono font-bold text-xs ${
                          tx.quantityDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.quantityDelta > 0 ? `+${tx.quantityDelta}` : tx.quantityDelta}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">{tx.notes || tx.type}</p>
                    <p className="text-[9px] text-gray-600 font-mono">
                      {new Date(tx.createdAt).toLocaleDateString()} • Balance: {tx.balanceAfter}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-white">Adjust Warehouse Stock</h3>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Target Warehouse</label>
                <select
                  value={adjustForm.warehouseId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Product</label>
                <select
                  value={adjustForm.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.titleEn} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Quantity Delta (+ or -)</label>
                <input
                  type="number"
                  required
                  value={adjustForm.deltaQuantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, deltaQuantity: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. +50 or -5"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Bulk restock shipment received"
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold"
                >
                  Apply Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
