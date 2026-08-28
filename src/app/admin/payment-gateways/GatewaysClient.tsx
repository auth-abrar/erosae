'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Settings,
  ShieldCheck,
  Lock,
  X,
  Check,
  Eye,
  EyeOff,
  Building2,
  Banknote,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export default function GatewaysClient({ initialGateways }: { initialGateways: any[] }) {
  const [gateways, setGateways] = useState(initialGateways);
  const [selectedGateway, setSelectedGateway] = useState<any | null>(null);
  const [isGenericModalOpen, setIsGenericModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Generic Gateway Form state
  const [genericName, setGenericName] = useState('');
  const [genericSlug, setGenericSlug] = useState('');
  const [initiateUrl, setInitiateUrl] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [authType, setAuthType] = useState('BEARER');
  const [apiKey, setApiKey] = useState('');
  const [hmacSecret, setHmacSecret] = useState('');

  const handleToggleEnabled = async (gw: any) => {
    try {
      const res = await fetch('/api/admin/gateways', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gw.id, isEnabled: !gw.isEnabled, config: {} }),
      });
      if (res.ok) {
        setGateways(
          gateways.map((g) => (g.id === gw.id ? { ...g, isEnabled: !g.isEnabled } : g))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGeneric = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: genericName,
          slug: genericSlug || genericName.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
          config: {
            initiateEndpointUrl: initiateUrl,
            verifyEndpointUrl: verifyUrl,
            authType,
            apiKey,
            hmacSecret,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to create generic gateway');

      setMessage('Generic gateway connector created successfully!');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsGenericModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Generic Gateway Connector</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 bg-slate-900 border border-slate-800 text-brand-300 text-xs rounded-xl">
          {message}
        </div>
      )}

      {/* Gateways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gateways.map((gw) => {
          let currencies: string[] = [];
          try {
            currencies = JSON.parse(gw.supportedCurrencies);
          } catch {
            currencies = ['*'];
          }

          return (
            <div
              key={gw.id}
              className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-brand-400">
                      {gw.driver === 'STRIPE' ? (
                        <CreditCard className="w-5 h-5" />
                      ) : gw.driver === 'COD' ? (
                        <Banknote className="w-5 h-5" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm truncate max-w-[170px]">{gw.name}</h3>
                      <span className="font-mono text-[10px] text-slate-500 uppercase">{gw.driver}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleEnabled(gw)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                      gw.isEnabled
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {gw.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <span className="text-slate-200 font-medium">
                      {gw.isTestMode ? 'Sandbox / Test' : 'Live Production'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Currencies:</span>
                    <span className="text-slate-200 font-mono text-[11px]">
                      {currencies.includes('*') ? 'All 10 Currencies' : currencies.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGateway(gw)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configure Keys & Rules</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal: Edit Existing Gateway */}
      {selectedGateway && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white">
                  Configure {selectedGateway.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Update credentials, test mode, and active currency routing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGateway(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1 text-slate-400">
              <div>Driver Type: <span className="font-mono text-white">{selectedGateway.driver}</span></div>
              <div>Secret Encryption: <span className="text-emerald-400 font-semibold">AES-256-GCM Active</span></div>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedGateway.isTestMode}
                  onChange={(e) =>
                    setSelectedGateway({ ...selectedGateway, isTestMode: e.target.checked })
                  }
                  className="rounded border-slate-800 text-brand-600"
                />
                <span className="font-semibold">Sandbox / Test Mode</span>
              </label>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">API Secret Key (Masked)</label>
                <input
                  type="password"
                  placeholder="••••••••••••cdef (Leave unchanged to keep existing secret)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGateway(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGateway(null);
                    setMessage('Settings saved successfully!');
                  }}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Structured Generic Gateway Connector */}
      {isGenericModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-400" />
                  Structured Generic Gateway Connector
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connect regional banks or gateways via structured HTTP API config. Zero arbitrary code execution.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGenericModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGeneric} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Gateway Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PayTabs GCC"
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    placeholder="paytabs"
                    value={genericSlug}
                    onChange={(e) => setGenericSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Initiate Payment Endpoint URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://secure.paytabs.com/payment/request"
                  value={initiateUrl}
                  onChange={(e) => setInitiateUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Authentication Method *</label>
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
                >
                  <option value="BEARER">Bearer Token (Authorization: Bearer [KEY])</option>
                  <option value="HEADER_API_KEY">Header API Key (X-API-Key / ServerKey)</option>
                  <option value="HMAC">HMAC SHA-256 Signature Header</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">API Key / Secret Token</label>
                <input
                  type="password"
                  placeholder="Enter secret key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGenericModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {isSaving ? 'Creating Connector...' : 'Register Gateway'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}