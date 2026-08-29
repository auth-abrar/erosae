'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  Scale,
} from 'lucide-react';

export default function AdminAccountingPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [journalForm, setJournalForm] = useState({
    description: '',
    lines: [
      { accountId: '', debitBDT: 0, creditBDT: 0, memo: '' },
      { accountId: '', debitBDT: 0, creditBDT: 0, memo: '' },
    ],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accounting');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts || []);
        setJournals(data.journals || []);
        if (data.accounts?.length >= 2) {
          setJournalForm((prev) => ({
            ...prev,
            lines: [
              { accountId: data.accounts[0].id, debitBDT: 0, creditBDT: 0, memo: '' },
              { accountId: data.accounts[1].id, debitBDT: 0, creditBDT: 0, memo: '' },
            ],
          }));
        }
      } else {
        setError(data.message || 'Failed to load accounting ledger.');
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

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journalForm),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setShowModal(false);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.message || 'Failed to record journal entry.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Landmark className="w-6 h-6 text-brand-500" />
            <span>Double-Entry General Ledger & ERP</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time Chart of Accounts, automatic order revenue recognition, and balanced journal entries in BDT.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-brand-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Manual Journal Entry</span>
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
          <span>Loading ledger from database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart of Accounts */}
          <div className="lg:col-span-5 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] border-b border-gray-800 pb-2 flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-500" />
              <span>Chart of Accounts</span>
            </h2>

            <div className="divide-y divide-gray-800">
              {accounts.map((acc) => (
                <div key={acc.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-white">{acc.code}</span>
                      <span className="font-semibold text-gray-300">{acc.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase">{acc.type}</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    ৳{acc.balanceBDT?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Journal Transactions */}
          <div className="lg:col-span-7 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] border-b border-gray-800 pb-2 flex items-center space-x-2">
              <Scale className="w-4 h-4 text-brand-500" />
              <span>General Journal Entries ({journals.length})</span>
            </h2>

            <div className="space-y-3">
              {journals.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  No journal entries recorded yet. Place an order or add a manual journal.
                </div>
              ) : (
                journals.map((j) => (
                  <div key={j.id} className="p-4 bg-gray-950/50 border border-gray-800/80 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                      <div>
                        <span className="font-mono font-bold text-brand-400">{j.entryNumber}</span>
                        <p className="text-gray-300 font-medium">{j.description}</p>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(j.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="divide-y divide-gray-800/40">
                      {j.lines?.map((line: any) => (
                        <div key={line.id} className="py-1.5 flex justify-between items-center text-[11px]">
                          <span className="text-gray-400">
                            {line.account?.code} - {line.account?.name}
                          </span>
                          <div className="space-x-4 font-mono font-bold">
                            {line.debitBDT > 0 && <span className="text-emerald-400">Dr ৳{line.debitBDT}</span>}
                            {line.creditBDT > 0 && <span className="text-amber-400">Cr ৳{line.creditBDT}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Journal Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-white">Record Balanced Journal Entry</h3>

            <form onSubmit={handleCreateJournal} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Journal Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Initial inventory purchase capitalization"
                  value={journalForm.description}
                  onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                />
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Debit Line</p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={journalForm.lines[0].accountId}
                    onChange={(e) => {
                      const updated = [...journalForm.lines];
                      updated[0].accountId = e.target.value;
                      setJournalForm({ ...journalForm, lines: updated });
                    }}
                    className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Debit Amount (৳)"
                    value={journalForm.lines[0].debitBDT || ''}
                    onChange={(e) => {
                      const updated = [...journalForm.lines];
                      updated[0].debitBDT = parseFloat(e.target.value) || 0;
                      updated[0].creditBDT = 0;
                      setJournalForm({ ...journalForm, lines: updated });
                    }}
                    className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono"
                  />
                </div>

                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Credit Line</p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={journalForm.lines[1].accountId}
                    onChange={(e) => {
                      const updated = [...journalForm.lines];
                      updated[1].accountId = e.target.value;
                      setJournalForm({ ...journalForm, lines: updated });
                    }}
                    className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Credit Amount (৳)"
                    value={journalForm.lines[1].creditBDT || ''}
                    onChange={(e) => {
                      const updated = [...journalForm.lines];
                      updated[1].creditBDT = parseFloat(e.target.value) || 0;
                      updated[1].debitBDT = 0;
                      setJournalForm({ ...journalForm, lines: updated });
                    }}
                    className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold"
                >
                  Post Journal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
