'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Globe,
  DollarSign,
  Truck,
  CreditCard,
  Mail,
  Search,
  Palette,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'store' | 'localization' | 'checkout' | 'orders' | 'seo' | 'theme'>('store');
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      } else {
        setError(data.message || 'Failed to load settings.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to settings API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.message || 'Failed to save settings.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while saving settings.');
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
            <Settings className="w-6 h-6 text-brand-500" />
            <span>Store Configuration & Operations Center</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Centrally manage brand identity, shipping thresholds, SEO metadata, and localization.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-brand-600/20 transition disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Settings successfully saved to database and live across platform!</span>
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
          <span>Loading configuration from database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-3 space-y-1">
            <button
              onClick={() => setActiveTab('store')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === 'store'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Store Information</span>
            </button>

            <button
              onClick={() => setActiveTab('localization')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === 'localization'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Localization & Time</span>
            </button>

            <button
              onClick={() => setActiveTab('checkout')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === 'checkout'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Checkout & Shipping Rules</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === 'orders'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Order Lifecycle & Rules</span>
            </button>

            <button
              onClick={() => setActiveTab('seo')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === 'seo'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>SEO & Metadata</span>
            </button>

            <button
              onClick={() => setActiveTab('theme')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === 'theme'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Theme & Typography</span>
            </button>
          </div>

          {/* Settings Tab Content */}
          <div className="lg:col-span-9 bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6">
            {/* Store Information */}
            {activeTab === 'store' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-white text-sm border-b border-gray-800 pb-2">
                  Store Identity & Contact
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Store Public Name</label>
                    <input
                      type="text"
                      value={settings['store.name'] || ''}
                      onChange={(e) => handleChange('store.name', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Legal Business Name</label>
                    <input
                      type="text"
                      value={settings['store.legalName'] || ''}
                      onChange={(e) => handleChange('store.legalName', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Official Support Email</label>
                    <input
                      type="email"
                      value={settings['store.contactEmail'] || ''}
                      onChange={(e) => handleChange('store.contactEmail', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Contact Hotline / WhatsApp</label>
                    <input
                      type="text"
                      value={settings['store.contactPhone'] || ''}
                      onChange={(e) => handleChange('store.contactPhone', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-gray-400 font-bold mb-1">Physical Business Address</label>
                    <textarea
                      rows={2}
                      value={settings['store.address'] || ''}
                      onChange={(e) => handleChange('store.address', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Localization */}
            {activeTab === 'localization' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-white text-sm border-b border-gray-800 pb-2">
                  Language & Regional Formats
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Default Language</label>
                    <select
                      value={settings['localization.defaultLanguage'] || 'en'}
                      onChange={(e) => handleChange('localization.defaultLanguage', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                    >
                      <option value="en">English (US)</option>
                      <option value="bn">Bengali (বাংলা)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">System Timezone</label>
                    <input
                      type="text"
                      value={settings['localization.timezone'] || 'Asia/Dhaka'}
                      onChange={(e) => handleChange('localization.timezone', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Checkout & Shipping Rules */}
            {activeTab === 'checkout' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-white text-sm border-b border-gray-800 pb-2">
                  Checkout & Regional Shipping Thresholds
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Inside Dhaka Shipping (৳)</label>
                    <input
                      type="number"
                      value={settings['checkout.insideDhakaRateBDT'] ?? 70}
                      onChange={(e) => handleChange('checkout.insideDhakaRateBDT', parseFloat(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Outside Dhaka Shipping (৳)</label>
                    <input
                      type="number"
                      value={settings['checkout.outsideDhakaRateBDT'] ?? 130}
                      onChange={(e) => handleChange('checkout.outsideDhakaRateBDT', parseFloat(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Free Shipping Threshold (৳)</label>
                    <input
                      type="number"
                      value={settings['checkout.freeShippingThresholdBDT'] ?? 3000}
                      onChange={(e) => handleChange('checkout.freeShippingThresholdBDT', parseFloat(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Orders */}
            {activeTab === 'orders' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-white text-sm border-b border-gray-800 pb-2">
                  Order Numbering & Cancellation
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Order Number Prefix</label>
                    <input
                      type="text"
                      value={settings['orders.prefix'] || 'ERO'}
                      onChange={(e) => handleChange('orders.prefix', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Customer Cancellation Window (Minutes)</label>
                    <input
                      type="number"
                      value={settings['orders.cancellationWindowMinutes'] ?? 60}
                      onChange={(e) => handleChange('orders.cancellationWindowMinutes', parseInt(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SEO */}
            {activeTab === 'seo' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-white text-sm border-b border-gray-800 pb-2">
                  Default Metadata & Open Graph
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Default Meta Title</label>
                    <input
                      type="text"
                      value={settings['seo.metaTitle'] || ''}
                      onChange={(e) => handleChange('seo.metaTitle', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Default Meta Description</label>
                    <textarea
                      rows={3}
                      value={settings['seo.metaDescription'] || ''}
                      onChange={(e) => handleChange('seo.metaDescription', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Theme */}
            {activeTab === 'theme' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-white text-sm border-b border-gray-800 pb-2">
                  Storefront Branding & Typography
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Primary Brand Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings['theme.primaryColor'] || '#c23c4e'}
                        onChange={(e) => handleChange('theme.primaryColor', e.target.value)}
                        className="w-10 h-10 bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings['theme.primaryColor'] || '#c23c4e'}
                        onChange={(e) => handleChange('theme.primaryColor', e.target.value)}
                        className="flex-grow px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Bengali Web Font</label>
                    <input
                      type="text"
                      disabled
                      value="SolaimanLipi (Configured)"
                      className="w-full px-3.5 py-2.5 bg-gray-950/50 border border-gray-800 rounded-xl text-gray-400 font-medium"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
