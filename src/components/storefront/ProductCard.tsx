'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ShoppingBag, Check } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';

export interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    sku: string;
    brand?: string | null;
    basePriceUSD: number;
    compareAtPriceUSD?: number | null;
    ratingAvg: number;
    ratingCount: number;
    category?: { name: string; slug: string } | null;
    images?: Array<{ url: string; altText?: string | null }>;
    variants?: Array<{ id: string; title: string; priceOffsetUSD: number; sku: string }>;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const [added, setAdded] = React.useState(false);

  const primaryImage =
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';
  const hoverImage = product.images?.[1]?.url || primaryImage;

  const hasDiscount =
    product.compareAtPriceUSD && product.compareAtPriceUSD > product.basePriceUSD;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compareAtPriceUSD! - product.basePriceUSD) / product.compareAtPriceUSD!) * 100
      )
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const firstVariant = product.variants?.[0];
    addItem({
      productId: product.id,
      variantId: firstVariant?.id,
      title: product.title,
      variantTitle: firstVariant?.title,
      sku: firstVariant?.sku || product.sku,
      image: primaryImage,
      basePriceUSD: product.basePriceUSD + (firstVariant?.priceOffsetUSD || 0),
      quantity: 1,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image Container */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square overflow-hidden bg-slate-100 block">
        <img
          src={primaryImage}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
            Save {discountPercent}%
          </span>
        )}

        {/* Brand Tag */}
        {product.brand && (
          <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
            {product.brand}
          </span>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category */}
          {product.category && (
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {product.category.name}
            </div>
          )}

          {/* Title */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 transition line-clamp-2">
              {product.title}
            </h3>
          </Link>

          {/* Star Rating */}
          <div className="flex items-center space-x-1 mt-1.5">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {product.ratingAvg > 0 ? product.ratingAvg.toFixed(1) : '5.0'}
            </span>
            <span className="text-xs text-slate-400">
              ({product.ratingCount || 12})
            </span>
          </div>
        </div>

        {/* Price & Quick Add Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-slate-900">
              {formatPrice(product.basePriceUSD)}
            </div>
            {hasDiscount && (
              <div className="text-xs text-slate-400 line-through">
                {formatPrice(product.compareAtPriceUSD!)}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            className={`p-2.5 rounded-full transition-all duration-200 ${
              added
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-white hover:bg-brand-600'
            }`}
            title="Add to Bag"
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}