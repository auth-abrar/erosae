import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import ProductCard from '@/components/storefront/ProductCard';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  CheckCircle2,
  TrendingUp,
  Percent,
} from 'lucide-react';

export const revalidate = 60; // ISR revalidate every 60s

async function getHomeData() {
  const categories = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    include: {
      children: true,
      _count: { select: { products: true } },
    },
    orderBy: { displayOrder: 'asc' },
  });

  const featuredProducts = await prisma.product.findMany({
    where: { isFeatured: true, isActive: true, deletedAt: null },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
    },
    take: 8,
    orderBy: { createdAt: 'desc' },
  });

  const newArrivals = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
    },
    take: 4,
    orderBy: { createdAt: 'desc' },
  });

  return { categories, featuredProducts, newArrivals };
}

export default async function HomePage() {
  const { categories, featuredProducts, newArrivals } = await getHomeData();

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-20 sm:py-32">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6 text-center sm:text-left">
            <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-brand-300">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Direct Merchant Inventory • 10 Regional Currencies</span>
            </div>

            <h1 className="font-['Cinzel'] text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
              Curated Global Living & Modern Luxury
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-light">
              Discover authentic fine fragrances, high-fidelity audio, horology timepieces, and artisanal homeware — delivered with express regional logistics across GCC & South Asia.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center sm:justify-start">
              <Link
                href="/products"
                className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm px-8 py-3.5 rounded-full shadow-lg hover:shadow-brand-600/30 transition flex items-center justify-center space-x-2"
              >
                <span>Shop All Collections</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products?category=beauty-fragrances"
                className="w-full sm:w-auto bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm px-8 py-3.5 rounded-full transition text-center"
              >
                Explore Arabian Oud
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY TILES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
              Browse By Department
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Explore Our Categories
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group relative h-72 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 block"
            >
              <img
                src={
                  cat.image ||
                  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
                }
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-6 text-white space-y-1">
                <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">
                  {cat._count.products} Products Available
                </span>
                <h3 className="text-lg font-bold group-hover:text-brand-300 transition">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-1 font-light">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
              Curated Selection
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Featured Best-Sellers
            </h2>
          </div>
          <Link
            href="/products?featured=true"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View All ({featuredProducts.length}) →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. PROMOTIONAL FLASH SALE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-950 via-slate-900 to-slate-950 text-white p-8 sm:p-14 border border-brand-900/50 shadow-2xl">
          <div className="max-w-xl space-y-4 relative z-10">
            <div className="inline-flex items-center space-x-2 bg-brand-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Percent className="w-3.5 h-3.5" />
              <span>Limited Launch Promotion</span>
            </div>
            <h3 className="font-['Cinzel'] text-3xl sm:text-4xl font-bold">
              Enjoy 10% Off Your First Order
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-light">
              Use code <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">WELCOME10</span> at checkout. Valid across all luxury categories and 10 regional currencies.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs px-6 py-3 rounded-full transition inline-flex items-center space-x-2"
              >
                <span>Claim Offer & Shop</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="hidden lg:block absolute -right-10 -bottom-10 w-96 h-96 opacity-10 bg-brand-500 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* 5. NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
              Fresh Inventory
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              New Arrivals This Week
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Browse Catalog →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}