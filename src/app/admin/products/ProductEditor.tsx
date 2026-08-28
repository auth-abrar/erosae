'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sliders,
  Layers,
  Check,
} from 'lucide-react';

export default function ProductEditor({
  product,
  categories,
  customFieldDefs,
}: {
  product?: any;
  categories: any[];
  customFieldDefs: any[];
}) {
  const router = useRouter();
  const isEditing = !!product;

  const [title, setTitle] = useState(product?.title || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?.id || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [basePriceUSD, setBasePriceUSD] = useState(product?.basePriceUSD?.toString() || '0');
  const [compareAtPriceUSD, setCompareAtPriceUSD] = useState(product?.compareAtPriceUSD?.toString() || '');
  const [costPriceUSD, setCostPriceUSD] = useState(product?.costPriceUSD?.toString() || '');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || '');
  const [description, setDescription] = useState(product?.description || '');
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured || false);

  // Images
  const [images, setImages] = useState<Array<{ url: string }>>(
    product?.images?.map((img: any) => ({ url: img.url })) || [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' },
    ]
  );

  // Variants
  const [variants, setVariants] = useState<Array<{ title: string; sku: string; priceOffsetUSD: number; stockQuantity: number }>>(
    product?.variants?.map((v: any) => ({
      title: v.title,
      sku: v.sku,
      priceOffsetUSD: v.priceOffsetUSD,
      stockQuantity: v.stockQuantity,
    })) || [
      { title: 'Standard Edition', sku: sku ? `${sku}-STD` : 'ERO-001-STD', priceOffsetUSD: 0, stockQuantity: 50 },
    ]
  );

  // Custom field values state: { [defId]: string | number }
  const initialCustomFields: Record<string, any> = {};
  if (product?.customFieldValues) {
    product.customFieldValues.forEach((cf: any) => {
      initialCustomFields[cf.definitionId] = cf.valueText || cf.valueNumber || '';
    });
  }
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>(initialCustomFields);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddImage = () => {
    setImages([...images, { url: '' }]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      { title: 'New Variant', sku: `${sku || 'SKU'}-${variants.length + 1}`, priceOffsetUSD: 0, stockQuantity: 10 },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const payload = {
        title,
        sku,
        categoryId,
        brand,
        basePriceUSD: parseFloat(basePriceUSD) || 0,
        compareAtPriceUSD: compareAtPriceUSD ? parseFloat(compareAtPriceUSD) : null,
        costPriceUSD: costPriceUSD ? parseFloat(costPriceUSD) : null,
        shortDescription,
        description,
        isFeatured,
        images: images.filter((img) => img.url.trim() !== ''),
        variants,
        customFieldValues,
      };

      const endpoint = isEditing ? `/api/admin/products/${product.id}` : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/products"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">
              {isEditing ? `Edit Product: ${product.title}` : 'Create New Product'}
            </h1>
            <p className="text-xs text-slate-400">
              Configure catalog details, pricing in USD, variant inventory, and custom fields.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg transition disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Update Product' : 'Publish Product'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-2xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Main Info, Pricing, Description, Images, Variants */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">General Information</h2>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Royal Dehn Al Oud Extrait de Parfum"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Primary SKU *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="ERO-OUD-001"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Brand / Designer</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Erosae Parfums Privé"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Short Tagline Description</label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief 1-sentence value proposition"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Detailed Description</label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive description of materials, notes, craftsmanship, and specs..."
                className="w-full p-3.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing in Base USD */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Pricing (Base USD)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Base Price (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={basePriceUSD}
                  onChange={(e) => setBasePriceUSD(e.target.value)}
                  placeholder="149.00"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Compare-At Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={compareAtPriceUSD}
                  onChange={(e) => setCompareAtPriceUSD(e.target.value)}
                  placeholder="199.00"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Cost Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costPriceUSD}
                  onChange={(e) => setCostPriceUSD(e.target.value)}
                  placeholder="65.00"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Gallery Images */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Product Gallery Images</h2>
              <button
                type="button"
                onClick={handleAddImage}
                className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Image URL
              </button>
            </div>

            <div className="space-y-3">
              {images.map((img, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-slate-500 font-mono w-4">{idx + 1}.</span>
                  <input
                    type="url"
                    value={img.url}
                    onChange={(e) => {
                      const updated = [...images];
                      updated[idx].url = e.target.value;
                      setImages(updated);
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:border-brand-500 focus:outline-none font-mono text-[11px]"
                  />
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Variants & Inventory */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Variants & Stock Allocation</h2>
              <button
                type="button"
                onClick={handleAddVariant}
                className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Variant
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div key={idx} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">Variant #{idx + 1}</span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Variant Title</label>
                      <input
                        type="text"
                        value={v.title}
                        onChange={(e) => {
                          const u = [...variants];
                          u[idx].title = e.target.value;
                          setVariants(u);
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Variant SKU</label>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => {
                          const u = [...variants];
                          u[idx].sku = e.target.value;
                          setVariants(u);
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Price Offset (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={v.priceOffsetUSD}
                        onChange={(e) => {
                          const u = [...variants];
                          u[idx].priceOffsetUSD = parseFloat(e.target.value) || 0;
                          setVariants(u);
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Stock Units</label>
                      <input
                        type="number"
                        value={v.stockQuantity}
                        onChange={(e) => {
                          const u = [...variants];
                          u[idx].stockQuantity = parseInt(e.target.value, 10) || 0;
                          setVariants(u);
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Category, Custom Fields Engine, Visibility */}
        <div className="space-y-6">
          {/* Category & Status */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Classification</h2>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-slate-800 text-brand-600 focus:ring-brand-500"
                />
                <span className="font-semibold">Featured on Homepage & Highlights</span>
              </label>
            </div>
          </div>

          {/* DYNAMIC CUSTOM FIELDS ENGINE */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-400" />
                Custom Fields Engine
              </h2>
              <Link href="/admin/custom-fields" className="text-brand-400 hover:text-brand-300 text-[11px] font-semibold">
                Manage Fields →
              </Link>
            </div>
            <p className="text-[11px] text-slate-400">
              Admin-created attributes rendered dynamically without database schema migrations.
            </p>

            {customFieldDefs.length === 0 ? (
              <div className="p-4 bg-slate-950 rounded-xl text-slate-500 text-center">
                No custom fields defined yet.
              </div>
            ) : (
              <div className="space-y-4">
                {customFieldDefs.map((def) => {
                  const currentValue = customFieldValues[def.id] || '';
                  const options = def.options ? JSON.parse(def.options) : [];

                  return (
                    <div key={def.id}>
                      <label className="block font-semibold text-slate-300 mb-1">
                        {def.name} {def.isRequired && <span className="text-rose-400">*</span>}
                      </label>

                      {def.fieldType === 'SELECT' ? (
                        <select
                          value={currentValue}
                          onChange={(e) =>
                            setCustomFieldValues({ ...customFieldValues, [def.id]: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
                        >
                          <option value="">Select an option...</option>
                          {options.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={def.fieldType === 'NUMBER' ? 'number' : 'text'}
                          value={currentValue}
                          onChange={(e) =>
                            setCustomFieldValues({ ...customFieldValues, [def.id]: e.target.value })
                          }
                          placeholder={`Enter ${def.name.toLowerCase()}...`}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}