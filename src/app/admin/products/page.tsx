'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Upload,
  Download,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Layers,
  Sparkles,
  Key,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  // Form State for creating a new product
  const [formData, setFormData] = useState({
    titleEn: '',
    titleBn: '',
    slug: '',
    descriptionEn: '',
    descriptionBn: '',
    basePriceBDT: '',
    type: 'PHYSICAL',
    sku: '',
    brand: '',
    categoryId: '',
    image: '',
    warrantyEn: '1 Year Warranty',
    warrantyBn: '১ বছরের ওয়ারেন্টি',
    stock: '50',
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
      ]);
      if (prodRes.success) setProducts(prodRes.products);
      if (catRes.success) setCategories(catRes.categories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        titleEn: formData.titleEn,
        titleBn: formData.titleBn,
        slug: formData.slug || formData.titleEn.toLowerCase().replace(/\s+/g, '-'),
        descriptionEn: formData.descriptionEn,
        descriptionBn: formData.descriptionBn,
        basePriceBDT: parseFloat(formData.basePriceBDT) || 1000,
        type: formData.type,
        sku: formData.sku || `SKU-${Date.now()}`,
        brand: formData.brand || 'Erosae',
        categoryId: formData.categoryId || (categories[0] ? categories[0].id : ''),
        image: formData.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        stock: parseInt(formData.stock) || 50,
        customFields: [
          { key: 'warranty', labelEn: 'Warranty', labelBn: 'ওয়ারেন্টি', valEn: formData.warrantyEn, valBn: formData.warrantyBn }
        ]
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        loadProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Title_EN', 'Title_BN', 'SKU', 'Type', 'Base_Price_BDT', 'Brand', 'Category'];
    const rows = products.map((p) => [
      p.id,
      `"${p.titleEn}"`,
      `"${p.titleBn}"`,
      p.sku,
      p.type,
      p.basePriceBDT,
      `"${p.brand || ''}"`,
      `"${p.category?.nameEn || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `erosae_products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.titleEn?.toLowerCase().includes(search.toLowerCase()) ||
      p.titleBn?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Package className="w-6 h-6 text-brand-500" />
            <span>Product Catalog Management</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Bilingual physical goods, digital keys, subscriptions, and CSV exports.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-brand-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by English, Bengali, or SKU..."
            className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>
        <p className="text-xs text-gray-400">Total: {filteredProducts.length} items</p>
      </div>

      {/* Products Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-950/70 border-b border-gray-800 text-gray-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Base Price (BDT)</th>
                <th className="py-3 px-4">Variants / Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-800/40 transition">
                    <td className="py-3 px-4 flex items-center space-x-3">
                      <img
                        src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-gray-800 border border-gray-700"
                      />
                      <div>
                        <p className="font-bold text-white line-clamp-1">{p.titleEn}</p>
                        <p className="text-[10px] text-gray-400">{p.titleBn}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-gray-800 text-brand-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-400">{p.sku}</td>
                    <td className="py-3 px-4 text-gray-300 font-medium">
                      {p.category?.nameEn || 'General'}
                    </td>
                    <td className="py-3 px-4 font-black text-white">
                      {formatCurrency(p.basePriceBDT, 'BDT')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        {p.variants?.length || 1} variants
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-800">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4">
              <h2 className="text-lg font-bold text-white">Create New Bilingual Product</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1">Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder="e.g. Aura ANC Headphones"
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Title (Bengali) *</label>
                  <input
                    type="text"
                    required
                    value={formData.titleBn}
                    onChange={(e) => setFormData({ ...formData, titleBn: e.target.value })}
                    placeholder="e.g. অরা ওয়্যারলেস হেডফোন"
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Product Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="PHYSICAL">Physical Good (শারীরিক পণ্য)</option>
                    <option value="DIGITAL">Digital Download (ফাইল ডাউনলোড)</option>
                    <option value="LICENSE_KEY">Software License Key (লাইসেন্স কি)</option>
                    <option value="SUBSCRIPTION_SERVICE">Subscription Service (সাবস্ক্রিপশন)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Base Price (BDT ৳) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.basePriceBDT}
                    onChange={(e) => setFormData({ ...formData, basePriceBDT: e.target.value })}
                    placeholder="2500"
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="ERO-ANC-001"
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameEn} ({c.nameBn})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-gray-400 mb-1">Description (English)</label>
                  <textarea
                    rows={2}
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    placeholder="High quality description..."
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-gray-400 mb-1">Description (Bengali - Natural Voice)</label>
                  <textarea
                    rows={2}
                    value={formData.descriptionBn}
                    onChange={(e) => setFormData({ ...formData, descriptionBn: e.target.value })}
                    placeholder="সাবলীল বাংলায় পণ্যের বিবরণ..."
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-semibold hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-600/20"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
