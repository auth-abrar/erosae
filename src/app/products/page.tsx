'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Filter, SlidersHorizontal, ArrowUpDown, Search } from 'lucide-react';

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('q') || '';

  const { locale, t } = useStore();
  const isBengali = locale === 'bn';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCategories(data.categories);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (searchQuery) params.set('q', searchQuery);
    if (sortBy) params.set('sort', sortBy);

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProducts(data.products);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {t('nav.all_products')}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isBengali
              ? `মোট ${products.length} টি পণ্য প্রদর্শিত হচ্ছে`
              : `Showing ${products.length} products`}
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">{isBengali ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {isBengali ? c.nameBn : c.nameEn}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="newest">{t('storefront.sort_newest')}</option>
            <option value="popular">{t('storefront.sort_popular')}</option>
            <option value="price_low">{t('storefront.sort_price_low')}</option>
            <option value="price_high">{t('storefront.sort_price_high')}</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">
              {t('storefront.no_products')}
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {isBengali
                ? 'অন্য কোনো ক্যাটাগরি বা সার্চ কিওয়ার্ড দিয়ে চেষ্টা করুন।'
                : 'Try adjusting your filters or search keywords to find what you are looking for.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSearchQuery('');
              }}
              className="mt-5 px-6 py-2.5 bg-brand-600 text-white rounded-full text-xs font-bold hover:bg-brand-700 transition"
            >
              {t('storefront.clear_filters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-xs">Loading catalog...</div>}>
      <ProductsCatalogContent />
    </Suspense>
  );
}
