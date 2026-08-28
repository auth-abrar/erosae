import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import ProductCard from '@/components/storefront/ProductCard';
import { Filter, SlidersHorizontal, ArrowUpDown, X, Sparkles } from 'lucide-react';

interface SearchParamsProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    featured?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: SearchParamsProps) {
  const params = await searchParams;
  const { category, q, minPrice, maxPrice, sort, featured, page = '1' } = params;

  const pageNum = parseInt(page, 10) || 1;
  const limit = 12;

  // Build filter query
  const where: any = {
    isActive: true,
    deletedAt: null,
  };

  if (featured === 'true') {
    where.isFeatured = true;
  }

  if (category) {
    where.category = {
      OR: [
        { slug: category },
        { parent: { slug: category } },
      ],
    };
  }

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { brand: { contains: q } },
      { sku: { contains: q } },
    ];
  }

  if (minPrice || maxPrice) {
    where.basePriceUSD = {};
    if (minPrice) where.basePriceUSD.gte = parseFloat(minPrice);
    if (maxPrice) where.basePriceUSD.lte = parseFloat(maxPrice);
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { basePriceUSD: 'asc' };
  else if (sort === 'price_desc') orderBy = { basePriceUSD: 'desc' };
  else if (sort === 'rating') orderBy = { ratingAvg: 'desc' };
  else if (sort === 'newest') orderBy = { createdAt: 'desc' };

  const [products, totalCount, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
      },
      orderBy,
      skip: (pageNum - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: { where: { isActive: true } },
        _count: { select: { products: true } },
      },
      orderBy: { displayOrder: 'asc' },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="pb-8 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">
            {q ? `Search Results for "${q}"` : category ? 'Filtered Collection' : 'Global Catalog'}
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900">
            {q ? `Results for "${q}"` : 'All Products & Collections'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing {products.length} of {totalCount} curated products
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sort by:</span>
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <Link
              href={`/products?${new URLSearchParams({ ...params, sort: 'featured' })}`}
              className={`px-3 py-1.5 rounded-lg transition ${!sort || sort === 'featured' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Featured
            </Link>
            <Link
              href={`/products?${new URLSearchParams({ ...params, sort: 'price_asc' })}`}
              className={`px-3 py-1.5 rounded-lg transition ${sort === 'price_asc' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Price: Low → High
            </Link>
            <Link
              href={`/products?${new URLSearchParams({ ...params, sort: 'price_desc' })}`}
              className={`px-3 py-1.5 rounded-lg transition ${sort === 'price_desc' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Price: High → Low
            </Link>
            <Link
              href={`/products?${new URLSearchParams({ ...params, sort: 'rating' })}`}
              className={`px-3 py-1.5 rounded-lg transition ${sort === 'rating' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Top Rated
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
        {/* Sidebar Filters */}
        <aside className="space-y-6 lg:border-r lg:border-slate-200 lg:pr-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Department
            </h3>
            <div className="space-y-1 text-xs">
              <Link
                href="/products"
                className={`block px-3 py-2 rounded-lg transition ${!category ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                All Departments
              </Link>
              {categories.map((cat) => {
                const isActive = category === cat.slug;
                return (
                  <div key={cat.id} className="space-y-1">
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className={`block px-3 py-2 rounded-lg transition ${isActive ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      {cat.name} ({cat._count.products})
                    </Link>
                    {cat.children && cat.children.length > 0 && (
                      <div className="pl-4 space-y-1 border-l border-slate-100 ml-3">
                        {cat.children.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/products?category=${sub.slug}`}
                            className={`block px-2 py-1 rounded-md text-[11px] ${category === sub.slug ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Price Filters */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Price Range (USD Base)
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <Link
                href={`/products?${new URLSearchParams({ ...params, minPrice: '0', maxPrice: '50' })}`}
                className="block hover:text-brand-600 py-1"
              >
                Under $50 USD
              </Link>
              <Link
                href={`/products?${new URLSearchParams({ ...params, minPrice: '50', maxPrice: '150' })}`}
                className="block hover:text-brand-600 py-1"
              >
                $50 to $150 USD
              </Link>
              <Link
                href={`/products?${new URLSearchParams({ ...params, minPrice: '150', maxPrice: '300' })}`}
                className="block hover:text-brand-600 py-1"
              >
                $150 to $300 USD
              </Link>
              <Link
                href={`/products?${new URLSearchParams({ ...params, minPrice: '300', maxPrice: '2000' })}`}
                className="block hover:text-brand-600 py-1"
              >
                $300 USD & Above
              </Link>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(category || q || minPrice || maxPrice || sort || featured) && (
            <div className="pt-4 border-t border-slate-200">
              <Link
                href="/products"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center space-x-1 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </Link>
            </div>
          )}
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-200/80 p-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                <Filter className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No products found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find any products matching your selected criteria. Try adjusting your filters or search query.
              </p>
              <Link
                href="/products"
                className="inline-block bg-slate-900 hover:bg-brand-600 text-white text-xs font-semibold px-6 py-2.5 rounded-full transition"
              >
                Clear Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center space-x-2 text-xs">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/products?${new URLSearchParams({ ...params, page: p.toString() })}`}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition ${
                    p === pageNum
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}