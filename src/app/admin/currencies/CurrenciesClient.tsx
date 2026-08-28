'use client';

import React, { useState } from 'react';
import { Globe, Edit, Check, X } from 'lucide-react';

export default function CurrenciesClient({ initialCurrencies }: { initialCurrencies: any[] }) {
  const [currencies, setCurrencies] = useState(initialCurrencies);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [newRate, setNewRate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStartEdit = (c: any) => {
    setEditingCode(c.code);
    setNewRate(c.exchangeRates?.[0]?.rateToBase?.toString() || '1.0');
  };

  const handleSaveRate = async (code: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencyCode: code, rateToBase: parseFloat(newRate) }),
      });

      if (res.ok) {
        setCurrencies(
          currencies.map((c) =>
            c.code === code
              ? {
                  ...c,
                  exchangeRates: [{ rateToBase: parseFloat(newRate), updatedAt: new Date() }],
                }
              : c
          )
        );
        setEditingCode(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xs">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold">
            <th className="p-4">Currency</th>
            <th className="p-4">Code</th>
            <th className="p-4">Symbols</th>
            <th className="p-4">Precision</th>
            <th className="p-4">Exchange Rate (Units per 1 USD)</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {currencies.map((c) => {
            const currentRate = c.exchangeRates?.[0]?.rateToBase || 1.0;
            const isEditing = editingCode === c.code;

            return (
              <tr key={c.code} className="hover:bg-slate-800/40 transition">
                <td className="p-4 font-bold text-white">
                  {c.name} {c.isBase && <span className="bg-brand-950 text-brand-300 border border-brand-800 text-[10px] px-1.5 py-0.2 rounded ml-1 font-mono">BASE</span>}
                </td>
                <td className="p-4 font-mono font-bold text-slate-300">{c.code}</td>
                <td className="p-4 font-mono">
                  <span className="text-white font-bold">{c.symbol}</span>
                  <span className="text-slate-500 ml-2">({c.symbolNative})</span>
                </td>
                <td className="p-4">
                  {c.decimalDigits === 3 ? (
                    <span className="bg-amber-950/80 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                      3 Decimals (e.g. 1.250)
                    </span>
                  ) : (
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">
                      2 Decimals (e.g. 12.50)
                    </span>
                  )}
                </td>
                <td className="p-4 font-mono">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.0001"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      className="w-32 px-2.5 py-1 bg-slate-950 border border-brand-500 text-white rounded-lg text-xs"
                    />
                  ) : (
                    <span className="font-bold text-white">1 USD = {currentRate} {c.code}</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {isEditing ? (
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSaveRate(c.code)}
                        disabled={isUpdating}
                        className="p-1.5 text-emerald-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCode(null)}
                        className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(c)}
                      className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg transition"
                      title="Edit Exchange Rate"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}