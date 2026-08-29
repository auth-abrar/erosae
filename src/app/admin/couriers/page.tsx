'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Save,
  Shield,
  Clock,
} from 'lucide-react';

export default function AdminCouriersPage() {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/couriers');
      const data = await res.json();
      if (data.success) {
        setCouriers(data.couriers || []);
      }
    } catch (err: any) {
      setError('Failed to fetch courier configurations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (c: any) => {
    try {
      const res = await fetch('/api/admin/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...c,
          isEnabled: !c.isEnabled,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      setError('Failed to toggle courier.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Truck className="w-6 h-6 text-brand-500" />
            <span>Courier Integration & Dispatch Hub</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Steadfast, Pathao, RedX, and Paperfly parcel generation and automated consignment tracking.
          </p>
        </div>
      </div>

      {/* Courier Status Banner */}
      <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center space-x-3 text-emerald-300 text-xs">
        <Shield className="w-5 h-5 flex-shrink-0" />
        <div>
          <span className="font-bold">Courier Dispatch Engine: ADAPTER ARCHITECTURE ACTIVE</span>
          <p className="text-[11px] opacity-80 mt-0.5">
            Steadfast and Pathao courier adapters are integrated with automated consignment creation, tracking sync, and handover manifests.
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
          <span>Loading couriers from database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {couriers.map((c) => (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-base font-mono">{c.provider}</h3>
                  <span className="text-[11px] text-gray-400">
                    {c.isSandbox ? 'Sandbox Test Environment' : 'Live Production'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggle(c)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    c.isEnabled
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {c.isEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Inside Dhaka Base Rate:</span>
                  <span className="font-mono font-bold text-white">৳{c.defaultInsideDhakaRateBDT}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Outside Dhaka Base Rate:</span>
                  <span className="font-mono font-bold text-white">৳{c.defaultOutsideDhakaRateBDT}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>API Key Configured:</span>
                  <span className="font-mono font-bold text-gray-300">
                    {c.apiKey ? '••••••••••••' : 'Not configured'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
