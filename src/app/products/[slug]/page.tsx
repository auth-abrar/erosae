'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingBag,
  Heart,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Key,
  Download,
  Info,
  Zap,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const { locale, formatPrice, addToCart, toggleWishlist, isInWishlist, t } = useStore();
  const isBengali = locale === 'bn';

  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products?q=${slug}`).then((r) => r.json());
        if (res.success && res.products.length > 0) {
          const p = res.products.find((item: any) => item.slug === slug) || res.products[0];
          setProduct(p);
          if (p.variants && p.variants.length > 0) {
            setSelectedVariant(p.variants[0]);
          }
          if (p.images && p.images.length > 0) {
            setSelectedImage(p.images[0].url);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded-xl w-3/4" />
            <div className="h-6 bg-gray-200 rounded-xl w-1/4" />
            <div className="h-24 bg-gray-200 rounded-2xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-xl font-bold text-gray-800">
          {isBengali ? 'পণ্যটি খুঁজে পাওয়া যায়নি' : 'Product Not Found'}
        </h2>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const activePriceBDT = selectedVariant ? selectedVariant.priceBDT : product.basePriceBDT;
  const inStock = selectedVariant ? selectedVariant.stockQuantity > 0 : true;

  const handleAddToCart = () => {
    addToCart(
      {
        productId: product.id,
        variantId: selectedVariant?.id,
        titleEn: product.titleEn,
        titleBn: product.titleBn,
        image: selectedImage || product.images?.[0]?.url,
        priceBDT: activePriceBDT,
        sku: selectedVariant?.sku || product.sku,
        productType: product.type,
        variantNameEn: selectedVariant?.nameEn,
        variantNameBn: selectedVariant?.nameBn,
      },
      quantity
    );
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Product Images Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm relative">
            <img
              src={selectedImage || product.images?.[0]?.url}
              alt={isBengali ? product.titleBn : product.titleEn}
              className="w-full h-full object-cover"
            />

            {/* Type badge */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              {product.type === 'SUBSCRIPTION_SERVICE' && (
                <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isBengali ? 'ডিজিটাল সাবস্ক্রিপশন সার্ভিস' : 'Subscription Service'}
                </span>
              )}
              {product.type === 'LICENSE_KEY' && (
                <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  {isBengali ? 'জেনুইন সফটওয়্যার লাইসেন্স' : 'Genuine License Key'}
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition ${
                isWishlisted ? 'bg-rose-50 text-rose-600' : 'bg-white text-gray-700 hover:text-rose-600'
              }`}
              title="Wishlist"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {product.images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.url)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition ${
                    selectedImage === img.url
                      ? 'border-brand-600 ring-2 ring-brand-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            {product.category && (
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                {isBengali ? product.category.nameBn : product.category.nameEn}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1 leading-tight">
              {isBengali ? product.titleBn : product.titleEn}
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-mono">SKU: {selectedVariant?.sku || product.sku}</p>
          </div>

          {/* Ratings & Status */}
          <div className="flex items-center space-x-4 border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-1 text-amber-400">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-bold text-gray-900 text-sm">
                {product.ratingAverage?.toFixed(1) || '5.0'}
              </span>
              <span className="text-gray-400 text-xs">
                ({product.ratingCount || 0} {t('storefront.reviews')})
              </span>
            </div>

            <div className="border-l border-gray-200 pl-4 flex items-center space-x-1 text-xs">
              {inStock ? (
                <span className="text-emerald-600 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('storefront.in_stock')}</span>
                </span>
              ) : (
                <span className="text-rose-600 font-bold flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t('storefront.out_of_stock')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-black text-gray-900">
                {formatPrice(activePriceBDT)}
              </span>
              {product.comparePriceBDT && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.comparePriceBDT)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              {isBengali
                ? 'অনলাইন পেমেন্ট, বিকাশ, নগদ ও ক্যাশ অন ডেলিভারি (COD) প্রযোজ্য।'
                : 'Supports Cash on Delivery, bKash, Nagad, Cards and International Gateways.'}
            </p>
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide">
                {isBengali ? 'ভেরিয়েন্ট বাছাই করুন' : 'Select Option / Variant'}
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                      selectedVariant?.id === v.id
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {isBengali ? v.nameBn : v.nameEn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              {isBengali ? 'পণ্যের বিবরণ' : 'Description'}
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {isBengali ? product.descriptionBn : product.descriptionEn}
            </p>
          </div>

          {/* Third-Party Subscription Activation Guide & Disclaimers */}
          {product.subscriptionConfig && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-amber-800 font-bold">
                <Info className="w-4 h-4" />
                <span>{isBengali ? 'অ্যাক্টিভেশন গাইড ও সার্ভিস নোটিশ' : 'Activation Guide & Service Notice'}</span>
              </div>
              <p className="text-amber-900 font-medium leading-relaxed">
                {isBengali ? product.subscriptionConfig.activationGuideBn : product.subscriptionConfig.activationGuideEn}
              </p>
              <p className="text-[11px] text-amber-700/80 pt-1 border-t border-amber-200">
                {isBengali ? product.subscriptionConfig.disclosureNoticeBn : product.subscriptionConfig.disclosureNoticeEn}
              </p>
            </div>
          )}

          {/* Quantity & Add to Cart / Buy Now */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center border border-gray-200 bg-white rounded-xl p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-bold"
                >
                  -
                </button>
                <span className="px-4 text-xs font-black text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-bold"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`flex-1 py-3.5 px-5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition duration-200 ${
                  inStock
                    ? 'bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {addedAnimation
                    ? isBengali
                      ? 'কার্টে যুক্ত হয়েছে!'
                      : 'Added to Cart!'
                    : t('storefront.add_to_cart')}
                </span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!inStock}
                className={`flex-1 py-3.5 px-5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition duration-200 ${
                  inStock
                    ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/30'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>{isBengali ? 'এখনই অর্ডার করুন' : 'Buy Now'}</span>
              </button>
            </div>
          </div>

          {/* Buyer Protection Trust Badges */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100 text-center">
            <div className="flex flex-col items-center space-y-1 text-gray-500">
              <Truck className="w-5 h-5 text-brand-600" />
              <span className="text-[11px] font-semibold">{t('features.shipping_title')}</span>
            </div>
            <div className="flex flex-col items-center space-y-1 text-gray-500">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <span className="text-[11px] font-semibold">{t('features.payment_title')}</span>
            </div>
            <div className="flex flex-col items-center space-y-1 text-gray-500">
              <RotateCcw className="w-5 h-5 text-brand-600" />
              <span className="text-[11px] font-semibold">{t('features.returns_title')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
