'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  History,
  Globe,
  Edit,
  Save,
} from 'lucide-react';

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [form, setForm] = useState({
    slug: '',
    titleEn: '',
    titleBn: '',
    contentEn: '',
    contentBn: '',
    changelog: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/policies');
      const data = await res.json();
      if (data.success) {
        setPolicies(data.policies || []);
        if (data.policies?.length > 0) {
          handleSelect(data.policies[0]);
        }
      } else {
        setError(data.message || 'Failed to load policies.');
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

  const handleSelect = (pol: any) => {
    setSelectedPolicy(pol);
    const latestVersion = pol.versions?.[0] || {};
    setForm({
      slug: pol.slug,
      titleEn: pol.titleEn,
      titleBn: pol.titleBn || pol.titleEn,
      contentEn: latestVersion.contentEn || '',
      contentBn: latestVersion.contentBn || '',
      changelog: '',
    });
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          status: 'PUBLISHED',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.message || 'Failed to publish policy.');
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
            <FileText className="w-6 h-6 text-brand-500" />
            <span>Policy CMS & Legal Versioning Hub</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Independently manage English and Bengali legal copy with immutable version history.
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
          <span>Loading policies from database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Policy List */}
          <div className="lg:col-span-4 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] border-b border-gray-800 pb-2">
              Published Legal Policies ({policies.length})
            </h2>

            <div className="space-y-2">
              {policies.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className={`p-3 rounded-2xl cursor-pointer transition ${
                    selectedPolicy?.id === p.id
                      ? 'bg-brand-600/10 border border-brand-500/30'
                      : 'hover:bg-gray-800/30'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{p.titleEn}</span>
                    <span className="bg-brand-950 text-brand-400 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                      v{p.currentVersion}.0
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">/{p.slug}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Editor */}
          <div className="lg:col-span-8 bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] border-b border-gray-800 pb-2 flex items-center justify-between">
              <span>{form.slug ? `Edit Policy (${form.slug})` : 'Policy Editor'}</span>
              {selectedPolicy && (
                <span className="text-gray-400 text-[10px]">
                  Current Active: v{selectedPolicy.currentVersion}.0
                </span>
              )}
            </h2>

            <form onSubmit={handlePublish} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Slug URL</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                    placeholder="privacy-policy"
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1">English Title</label>
                  <input
                    type="text"
                    required
                    value={form.titleEn}
                    onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1">Bengali Title</label>
                  <input
                    type="text"
                    required
                    value={form.titleBn}
                    onChange={(e) => setForm({ ...form, titleBn: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white font-bengali"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">
                    English Content (Markdown)
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={form.contentEn}
                    onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1">
                    Bengali Content (Markdown - SolaimanLipi)
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={form.contentBn}
                    onChange={(e) => setForm({ ...form, contentBn: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-bengali text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Version Changelog Note</label>
                <input
                  type="text"
                  placeholder="e.g. Updated returns timeline from 7 to 14 days"
                  value={form.changelog}
                  onChange={(e) => setForm({ ...form, changelog: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-lg shadow-brand-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Publish New Version</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
