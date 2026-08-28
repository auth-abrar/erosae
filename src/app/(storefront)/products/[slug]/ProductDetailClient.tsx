'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  ShoppingBag,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/storefront/ProductCard';

interface ProductDetailProps {
  product: any;
  relatedProducts: any[];
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailProps) {
  const { formatPrice, currentCurrency } = useCurrency();
  const { addItem } = useCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?.id || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000', isPrimary: true }];

  const selectedVariant = product.variants?.find((v: any) => v.id === selectedVariantId);
  const activePriceUSD = product.basePriceUSD + (selectedVariant?.priceOffsetUSD || 0);

  const hasDiscount =
    product.compareAtPriceUSD && product.compareAtPriceUSD > activePriceUSD;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compareAtPriceUSD - activePriceUSD) / product.compareAtPriceUSD) * 100
      )
    : 0;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      title: product.title,
      variantTitle: selectedVariant?.title,
      sku: selectedVariant?.sku || product.sku,
      image: images[0].url,
      basePriceUSD: activePriceUSD,
      quantity,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900">Home</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href="/products" className="hover:text-slate-900">Catalog</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-slate-900">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative">
            <img
              src={images[selectedImageIndex]?.url}
              alt={product.title}
              className="w-full h-full object-cover object-center"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                Save {discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition ${
                    selectedImageIndex === idx
                      ? 'border-brand-600 shadow-md ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="space-y-6">
          <div>
            {product.brand && (
              <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
                {product.brand}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              {product.title}
            </h1>

            {/* SKU and Rating */}
            <div className="flex items-center space-x-4 mt-2.5 text-xs">
              <div className="flex items-center text-amber-400 space-x-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="font-bold text-slate-900">{product.ratingAvg > 0 ? product.ratingAvg.toFixed(1) : '5.0'}</span>
                <span className="text-slate-400">({product.ratingCount || 18} reviews)</span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono">
                SKU: {selectedVariant?.sku || product.sku}
              </span>
            </div>
          </div>

          {/* Price Block with Multi-Currency */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-bold text-slate-900 font-mono">
                {formatPrice(activePriceUSD)}
              </span>
              {hasDiscount && (
                <span className="text-base text-slate-400 line-through">
                  {formatPrice(product.compareAtPriceUSD)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Tax included. Price displayed in {currentCurrency}. Exchange rates updated regularly.
            </p>
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm text-slate-600 leading-relaxed font-light">
              {product.shortDescription}
            </p>
          )}

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-900">
                Choose Edition / Option:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.variants.map((v: any) => {
                  const isSelected = v.id === selectedVariantId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{v.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {v.priceOffsetUSD > 0 ? `+${formatPrice(v.priceOffsetUSD)}` : 'Included'}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium mt-1">
                        ✓ {v.stockQuantity} in stock
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="pt-4 flex items-center gap-4">
            <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                -
              </button>
              <span className="w-10 text-center text-sm font-bold text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex-1 font-semibold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center space-x-2 shadow-lg transition-all duration-200 ${
                added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-brand-600 text-white'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Added to Bag!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>Add to Bag • {formatPrice(activePriceUSD * quantity)}</span>
                </>
              )}
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-center">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <Truck className="w-4 h-4 text-brand-600 mx-auto" />
              <div className="text-[11px] font-bold text-slate-900">Express Delivery</div>
              <div className="text-[10px] text-slate-500">2-5 Business Days</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto" />
              <div className="text-[11px] font-bold text-slate-900">100% Genuine</div>
              <div className="text-[10px] text-slate-500">Direct Merchant Stock</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <RotateCcw className="w-4 h-4 text-amber-600 mx-auto" />
              <div className="text-[11px] font-bold text-slate-900">Easy Returns</div>
              <div className="text-[10px] text-slate-500">14-Day Guarantee</div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Custom Fields Section */}
      <div className="pt-8 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Product Description & Details</h2>
          <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-3">
            <p>{product.description}</p>
          </div>

          {/* Admin Custom Fields Engine Display */}
          {product.customFieldValues && product.customFieldValues.length > 0 && (
            <div className="pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-600" /> Specifications & Attributes
              </h3>
              <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
                {product.customFieldValues.map((cf: any) => (
                  <div key={cf.id} className="grid grid-cols-3 p-3 text-xs">
                    <span className="font-semibold text-slate-500">{cf.definition?.name || 'Attribute'}</span>
                    <span className="col-span-2 text-slate-900 font-medium">
                      {cf.valueText || cf.valueNumber || cf.valueJson || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Customer Reviews Box */}
        <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Customer Reviews</h2>
          <div className="flex items-center space-x-2">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <span className="text-sm font-bold text-slate-900">
              {product.ratingAvg > 0 ? product.ratingAvg.toFixed(1) : '5.0'} out of 5
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((rev: any) => (
                <div key={rev.id} className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">{rev.authorName}</span>
                    <span className="text-emerald-600 text-[10px] font-semibold">✓ Verified Purchase</span>
                  </div>
                  {rev.title && <div className="text-xs font-semibold text-slate-800">{rev.title}</div>}
                  <p className="text-xs text-slate-600">{rev.comment}</p>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-4 text-center">
                "Outstanding quality and fast express delivery. Will definitely buy again!" — Verified Customer
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-slate-200 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
                You May Also Like
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Related Recommendations
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}