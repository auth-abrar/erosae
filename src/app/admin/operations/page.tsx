'use client';

import React, { useState, useEffect } from 'react';

export default function OperationsDashboard() {
  const [activeTab, setActiveTab] = useState<'PICKING' | 'PACKING' | 'HANDOVER' | 'SERIALS' | 'RECONCILIATION'>('PICKING');
  const [scannedInput, setScannedInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState<{ type: 'SUCCESS' | 'ERROR' | 'INFO'; message: string } | null>(null);

  // Picking State
  const [pickLists, setPickLists] = useState<any[]>([]);
  const [selectedPickList, setSelectedPickList] = useState<any | null>(null);

  // Handover State
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);

  // Serials State
  const [serials, setSerials] = useState<any[]>([]);

  useEffect(() => {
    fetchPickLists();
    fetchHandoverSessions();
    fetchSerials();
  }, []);

  const fetchPickLists = async () => {
    try {
      const res = await fetch('/api/admin/operations/picking');
      const data = await res.json();
      if (data.success) {
        setPickLists(data.pickLists);
        if (data.pickLists.length > 0 && !selectedPickList) {
          setSelectedPickList(data.pickLists[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHandoverSessions = async () => {
    try {
      const res = await fetch('/api/admin/operations/handover');
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSerials = async () => {
    try {
      const res = await fetch('/api/admin/operations/serial-numbers');
      const data = await res.json();
      if (data.success) {
        setSerials(data.serials);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePickScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedInput || !selectedPickList) return;

    try {
      const res = await fetch('/api/admin/operations/picking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SCAN_ITEM',
          pickListId: selectedPickList.id,
          barcode: scannedInput,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setScanFeedback({ type: 'SUCCESS', message: data.message });
        fetchPickLists();
      } else {
        setScanFeedback({ type: 'ERROR', message: data.message || data.error });
      }
    } catch (err: any) {
      setScanFeedback({ type: 'ERROR', message: err.message });
    }
    setScannedInput('');
  };

  const handleHandoverScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedInput || !activeSession) return;

    try {
      const res = await fetch('/api/admin/operations/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SCAN_PARCEL',
          sessionId: activeSession.id,
          trackingCode: scannedInput,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setScanFeedback({
          type: 'SUCCESS',
          message: `✅ Parcel Added! Total Parcels: ${data.sessionTotals.parcels} (৳${data.sessionTotals.totalCodBDT} COD)`,
        });
        fetchHandoverSessions();
      } else {
        setScanFeedback({ type: 'ERROR', message: data.error || 'Scan failed' });
      }
    } catch (err: any) {
      setScanFeedback({ type: 'ERROR', message: err.message });
    }
    setScannedInput('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
              Warehouse Ops v4.0
            </span>
            <span className="text-xs text-slate-400 font-mono">Terminal Active</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">Warehouse & Dispatch Operations</h1>
          <p className="text-slate-400 text-sm">Barcode Verification, Picking, Packing, Courier Handover & Manifests</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          {(['PICKING', 'PACKING', 'HANDOVER', 'SERIALS', 'RECONCILIATION'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setScanFeedback(null);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab === 'PICKING' && '📦 Order Picking'}
              {tab === 'PACKING' && '🏷️ Packing & Labels'}
              {tab === 'HANDOVER' && '🚚 Courier Handover'}
              {tab === 'SERIALS' && '🔢 Serial Numbers'}
              {tab === 'RECONCILIATION' && '💰 COD Settlement'}
            </button>
          ))}
        </div>
      </div>

      {/* Global Barcode Scanning Feedback Banner */}
      {scanFeedback && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-lg border transition-all ${
            scanFeedback.type === 'SUCCESS'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
              : scanFeedback.type === 'ERROR'
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-blue-950/80 border-blue-500 text-blue-300'
          }`}
        >
          <span>{scanFeedback.message}</span>
          <button onClick={() => setScanFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss ✕
          </button>
        </div>
      )}

      {/* TAB 1: ORDER PICKING */}
      {activeTab === 'PICKING' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Pick Lists Sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Active Pick Lists</h2>
            <div className="space-y-2">
              {pickLists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPickList(pl)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedPickList?.id === pl.id
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-sm text-slate-800">{pl.pickNumber}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        pl.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {pl.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{pl.items.length} items to pick</p>
                </div>
              ))}
            </div>
          </div>

          {/* Picking Station & Scanner */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Pick Station: <span className="font-mono text-emerald-600">{selectedPickList?.pickNumber || 'None'}</span>
              </h2>
              <p className="text-xs text-slate-500">Scan product SKU or barcode to verify items into your tote</p>
            </div>

            {/* Fast Keyboard / Gun Scanner Input */}
            <form onSubmit={handlePickScan} className="flex gap-3">
              <input
                type="text"
                value={scannedInput}
                onChange={(e) => setScannedInput(e.target.value)}
                placeholder="Scan item barcode or SKU with USB/BT Scanner..."
                autoFocus
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
              >
                Verify Item ↵
              </button>
            </form>

            {/* Item Verification Checklist */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Items in this Batch</h3>
              {selectedPickList?.items.map((item: any) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    item.isVerified
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">{item.product.titleEn}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      SKU: {item.product.sku} | Barcode: {item.product.barcode || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold font-mono ${
                        item.isVerified ? 'text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      {item.quantityPicked} / {item.quantityOrdered}
                    </span>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {item.isVerified ? '✅ VERIFIED' : '⏳ PENDING'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COURIER HANDOVER */}
      {activeTab === 'HANDOVER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">Handover Sessions</h2>
            </div>
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    activeSession?.id === s.id
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-sm text-slate-800">{s.sessionNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
                      {s.courierCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {s.totalParcels} parcels • ৳{s.totalCodBDT.toLocaleString()} COD
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Courier Handover Station: <span className="font-mono text-emerald-600">{activeSession?.sessionNumber || 'Select or Start Session'}</span>
              </h2>
              <p className="text-xs text-slate-500">Scan parcel barcodes as you hand them over to the rider</p>
            </div>

            <form onSubmit={handleHandoverScan} className="flex gap-3">
              <input
                type="text"
                value={scannedInput}
                onChange={(e) => setScannedInput(e.target.value)}
                placeholder="Scan parcel tracking number or barcode..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
              >
                Scan Parcel ↵
              </button>
            </form>

            <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400">Total Scanned in Session</p>
                <p className="text-2xl font-bold font-mono text-emerald-400">
                  {activeSession?.totalParcels || 0} Parcels
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Expected COD</p>
                <p className="text-2xl font-bold font-mono text-white">
                  ৳{(activeSession?.totalCodBDT || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SERIAL NUMBERS */}
      {activeTab === 'SERIALS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Serialized Inventory & IMEI Registry</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Serial / IMEI</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serials.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-mono font-bold text-slate-900">{s.serialNumber}</td>
                    <td className="p-3 font-medium text-slate-800">{s.product.titleEn}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
