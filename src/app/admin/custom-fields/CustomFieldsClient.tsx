'use client';

import React, { useState } from 'react';
import { Sliders, Plus, Trash2, X, Check } from 'lucide-react';

export default function CustomFieldsClient({
  initialFields,
  categories,
}: {
  initialFields: any[];
  categories: any[];
}) {
  const [fields, setFields] = useState(initialFields);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [fieldType, setFieldType] = useState('TEXT');
  const [optionsStr, setOptionsStr] = useState('');
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let options = null;
      if (fieldType === 'SELECT' && optionsStr) {
        options = optionsStr.split(',').map((o) => o.trim()).filter(Boolean);
      }

      const res = await fetch('/api/admin/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          key: key || name.toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
          fieldType,
          options,
          targetCategoryId: targetCategoryId || null,
          isRequired,
        }),
      });

      if (!res.ok) throw new Error('Failed to create custom field');
      window.location.reload();
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom field?')) return;
    try {
      await fetch(`/api/admin/custom-fields?id=${id}`, { method: 'DELETE' });
      setFields(fields.filter((f) => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Field Definition</span>
        </button>
      </div>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold">
              <th className="p-4">Field Label</th>
              <th className="p-4">Internal Key</th>
              <th className="p-4">Data Type</th>
              <th className="p-4">Applied Category</th>
              <th className="p-4">Active Values</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {fields.map((f) => (
              <tr key={f.id} className="hover:bg-slate-800/40 transition">
                <td className="p-4 font-bold text-white">{f.name}</td>
                <td className="p-4 font-mono text-slate-400">{f.key}</td>
                <td className="p-4">
                  <span className="bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded text-[10px]">
                    {f.fieldType}
                  </span>
                </td>
                <td className="p-4 text-slate-300">
                  {f.targetCategory ? f.targetCategory.name : 'All Categories'}
                </td>
                <td className="p-4 text-slate-400">{f._count?.values || 0} Products</td>
                <td className="p-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                    title="Delete Field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <h3 className="text-base font-bold text-white">Create Custom Field</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Field Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scent Sillage Intensity"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Internal Key *</label>
                <input
                  type="text"
                  placeholder="scent_sillage"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Field Type *</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
                >
                  <option value="TEXT">Short Text</option>
                  <option value="NUMBER">Number / Metric</option>
                  <option value="SELECT">Select Dropdown Options</option>
                  <option value="BOOLEAN">Toggle Yes/No</option>
                </select>
              </div>

              {fieldType === 'SELECT' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Options (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Moderate, Strong, Enormous Sillage"
                    value={optionsStr}
                    onChange={(e) => setOptionsStr(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Apply to Specific Category</label>
                <select
                  value={targetCategoryId}
                  onChange={(e) => setTargetCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
                >
                  <option value="">All Categories (Global Attribute)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  Save Definition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}