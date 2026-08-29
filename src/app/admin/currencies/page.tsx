'use client';

import React, { useState, useEffect } from 'react';
import {
  Coins,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Save,
  Globe,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function AdminCurrenciesPage() {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    code: '',
    nameEn: '',
    nameBn: '',
    symbol: '',
    symbolPosition: 'BEFORE',
    decimalPlaces: 2,
    exchangeRateToBDT: 1.0,
    isActive: true,
    customSvg: '',
  });

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/currencies');
      const data = await res.json();
      if (data.success) {
        setCurrencies(data.currencies);
      }
    } catch (err: any) {
      setError('Failed to fetch currencies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const handleEdit = (curr: any) => {
    setForm({
      code: curr.code,
      nameEn: curr.nameEn,
      nameBn: curr.nameBn,
      symbol: curr.symbol,
      symbolPosition: curr.symbolPosition || 'BEFORE',
      decimalPlaces: curr.decimalPlaces || 2,
      exchangeRateToBDT: curr.exchangeRateToBDT,
      isActive: curr.isActive,
      customSvg: '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        fetchCurrencies();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(data.message || 'Failed to save currency.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Coins className="w-6 h-6 text-brand-500" />
            <span>FX Multi-Currency & Rate Manager</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Anchored in BDT (৳) base. Configure international currencies, exchange rates, and custom SVG currency icons.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Currencies Table */}
        <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] border-b border-gray-800 pb-2">
            Configured System Currencies
          </h2>

          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-500" />
              <span>Loading currencies from database...</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {currencies.map((curr) => (
                <div
                  key={curr.code}
                  className="py-3.5 flex items-center justify-between hover:bg-gray-800/30 px-2 rounded-xl transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-7 h-7 bg-brand-600/20 text-brand-400 font-black rounded-lg flex items-center justify-center text-xs">
                        {curr.symbol}
                      </span>
                      <span className="font-bold text-white text-xs font-mono">{curr.code}</span>
                      {curr.isDefault && (
                        <span className="bg-brand-500/20 text-brand-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          BASE
                        </span>
                      )}
                      {!curr.isActive && (
                        <span className="bg-gray-800 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          DISABLED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {curr.nameEn} • {curr.nameBn}
                    </p>
                  </div>

                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <p className="font-mono font-bold text-xs text-white">
                        1 {curr.code} = ৳{curr.exchangeRateToBDT}
                      </p>
                      <p className="text-[10px] text-gray-500">{curr.decimalPlaces} decimals</p>
                    </div>
                    <button
                      onClick={() => handleEdit(curr)}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Currency Form / Editor */}
        <div className="lg:col-span-5 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] border-b border-gray-800 pb-2 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-brand-500" />
            <span>{form.code ? `Edit Currency (${form.code})` : 'Add New Currency'}</span>
          </h2>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 font-bold mb-1">ISO Code</label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MYR"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Symbol</label>
                <input
                  type="text"
                  required
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  placeholder="e.g. RM"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 font-bold mb-1">English Name</label>
                <input
                  type="text"
                  required
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  placeholder="Malaysian Ringgit"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Bengali Name</label>
                <input
                  type="text"
                  required
                  value={form.nameBn}
                  onChange={(e) => setForm({ ...form, nameBn: e.target.value })}
                  placeholder="মালয়েশিয়ান রিঙ্গিত"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-bengali"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Rate in BDT (৳)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  disabled={form.code === 'BDT'}
                  value={form.exchangeRateToBDT}
                  onChange={(e) => setForm({ ...form, exchangeRateToBDT: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Decimals</label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={form.decimalPlaces}
                  onChange={(e) => setForm({ ...form, decimalPlaces: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 font-bold mb-1">Custom SVG Icon (Optional)</label>
              <textarea
                rows={2}
                value={form.customSvg}
                onChange={(e) => setForm({ ...form, customSvg: e.target.value })}
                placeholder="<svg ...>...</svg>"
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono text-[11px]"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                🔒 Protected by SvgSanitizer against inline scripts & XSS.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-brand-600/20 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Currency to Database'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
