'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { ShoppingBag, Star, Eye, Heart, Sparkles, Key, Download } from 'lucide-react';

export interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    type?: string;
    titleEn: string;
    titleBn: string;
    basePriceBDT: number;
    comparePriceBDT?: number | null;
    sku: string;
    brand?: { nameEn: string; nameBn: string } | null;
    ratingAverage: number;
    ratingCount: number;
    images?: { url: string; isPrimary: boolean }[];
    category?: { nameEn: string; nameBn: string; slug: string };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { locale, formatPrice, addToCart, toggleWishlist, isInWishlist, t } = useStore();
  const isBengali = locale === 'bn';
  const isWishlisted = isInWishlist(product.id);

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      titleEn: product.titleEn,
      titleBn: product.titleBn,
      image: primaryImage,
      priceBDT: product.basePriceBDT,
      sku: product.sku,
      productType: product.type || 'PHYSICAL',
    });
  };

  const discountPercent =
    product.comparePriceBDT && product.comparePriceBDT > product.basePriceBDT
      ? Math.round(
          ((product.comparePriceBDT - product.basePriceBDT) / product.comparePriceBDT) * 100
        )
      : null;

  return (
    <div className="group relative bg-white border border-gray-100/90 rounded-2xl overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Thumbnail & Badges */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Link href={`/products/${product.slug}`}>
            <img
              src={primaryImage}
              alt={isBengali ? product.titleBn : product.titleEn}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              loading="lazy"
            />
          </Link>

          {/* Badges container */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {discountPercent && (
              <span className="bg-brand-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                {discountPercent}% {isBengali ? 'ছাড়' : 'OFF'}
              </span>
            )}
            {product.type === 'SUBSCRIPTION_SERVICE' && (
              <span className="bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                {isBengali ? 'সাবস্ক্রিপশন' : 'Subscription'}
              </span>
            )}
            {product.type === 'LICENSE_KEY' && (
              <span className="bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                <Key className="w-2.5 h-2.5" />
                {isBengali ? 'ডিজিটাল কি' : 'License Key'}
              </span>
            )}
          </div>

          {/* Wishlist toggle */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition z-10 ${
              isWishlisted
                ? 'bg-rose-50 text-rose-600'
                : 'bg-white/80 text-gray-600 hover:bg-white hover:text-rose-600'
            }`}
            title="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          {/* Quick Action overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2 pointer-events-none">
            <Link
              href={`/products/${product.slug}`}
              className="pointer-events-auto p-2.5 bg-white text-gray-800 rounded-full hover:bg-brand-600 hover:text-white transition shadow-lg transform -translate-y-2 group-hover:translate-y-0 duration-300"
              title={t('storefront.view_details')}
            >
              <Eye className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {product.category && (
            <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider">
              {isBengali ? product.category.nameBn : product.category.nameEn}
            </p>
          )}

          <Link href={`/products/${product.slug}`}>
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-brand-600 transition leading-snug">
              {isBengali ? product.titleBn : product.titleEn}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center space-x-1 text-xs">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-bold text-gray-800 text-xs">
              {product.ratingAverage?.toFixed(1) || '5.0'}
            </span>
            <span className="text-gray-400 text-[11px]">
              ({product.ratingCount || 0})
            </span>
          </div>
        </div>
      </div>

      {/* Price & Add to Cart button */}
      <div className="p-4 pt-0 flex items-center justify-between border-t border-gray-50 mt-2">
        <div>
          <p className="text-sm font-black text-gray-900">
            {formatPrice(product.basePriceBDT)}
          </p>
          {product.comparePriceBDT && (
            <p className="text-[11px] text-gray-400 line-through">
              {formatPrice(product.comparePriceBDT)}
            </p>
          )}
        </div>

        <button
          onClick={handleQuickAdd}
          className="p-2.5 bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white rounded-xl transition duration-200"
          title={t('storefront.add_to_cart')}
        >
          <ShoppingBag className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
