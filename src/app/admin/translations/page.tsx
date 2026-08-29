'use client';

import React, { useState, useEffect } from 'react';
import {
  Languages,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Save,
  Search,
} from 'lucide-react';

export default function AdminTranslationsPage() {
  const [translations, setTranslations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  const [editForm, setEditForm] = useState({
    key: '',
    namespace: 'storefront',
    valueEn: '',
    valueBn: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/translations');
      const data = await res.json();
      if (data.success) {
        setTranslations(data.translations || []);
      } else {
        setError(data.message || 'Failed to load translations.');
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

  const handleEdit = (t: any) => {
    setEditForm({
      key: t.key,
      namespace: t.namespace,
      valueEn: t.valueEn,
      valueBn: t.valueBn,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(data.message || 'Failed to save translation.');
      }
    } catch (err: any) {
      setError(err.message || 'Server error.');
    }
  };

  const filteredTranslations = translations.filter(
    (t) =>
      t.key.toLowerCase().includes(search.toLowerCase()) ||
      t.valueEn.toLowerCase().includes(search.toLowerCase()) ||
      t.valueBn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Languages className="w-6 h-6 text-brand-500" />
            <span>Independent English & Bangla Translations</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Human-written bilingual dictionary rendered in SolaimanLipi without automatic machine overwrites.
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
        {/* Translations Table */}
        <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">
              Translation Keys ({translations.length})
            </h2>

            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search keys..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-950 border border-gray-800 rounded-xl text-white text-xs"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-500" />
              <span>Loading dictionary from database...</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto">
              {filteredTranslations.map((t) => (
                <div
                  key={`${t.namespace}-${t.key}`}
                  className="py-3 flex justify-between items-start hover:bg-gray-800/30 px-2 rounded-xl transition text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-mono font-bold text-brand-400 text-[11px]">{t.key}</span>
                    <p className="text-white font-medium">{t.valueEn}</p>
                    <p className="text-emerald-400 font-bengali">{t.valueBn}</p>
                  </div>

                  <button
                    onClick={() => handleEdit(t)}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Translation Key Editor */}
        <div className="lg:col-span-5 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] border-b border-gray-800 pb-2">
            {editForm.key ? `Edit Key: ${editForm.key}` : 'Add / Modify Translation'}
          </h2>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-400 font-bold mb-1">Key Name</label>
              <input
                type="text"
                required
                value={editForm.key}
                onChange={(e) => setEditForm({ ...editForm, key: e.target.value.toLowerCase() })}
                placeholder="e.g. cart.checkout_now"
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-400 font-bold mb-1">Namespace</label>
              <input
                type="text"
                value={editForm.namespace}
                onChange={(e) => setEditForm({ ...editForm, namespace: e.target.value.toLowerCase() })}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-400 font-bold mb-1">English Copy</label>
              <textarea
                rows={2}
                required
                value={editForm.valueEn}
                onChange={(e) => setEditForm({ ...editForm, valueEn: e.target.value })}
                placeholder="Proceed to Checkout"
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 font-bold mb-1">
                Bengali Copy (SolaimanLipi)
              </label>
              <textarea
                rows={2}
                required
                value={editForm.valueBn}
                onChange={(e) => setEditForm({ ...editForm, valueBn: e.target.value })}
                placeholder="চেকআউটে এগিয়ে যান"
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-bengali text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-brand-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Translation Key</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
