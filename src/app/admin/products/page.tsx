import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import {
  Package,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Sliders,
  Edit,
  ExternalLink,
} from 'lucide-react';
import ProductListClient from './ProductListClient';

export default async function AdminProductsPage() {
  const [products, categories, customFieldDefs] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: true,
        images: { take: 1 },
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.customFieldDefinition.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Catalog & SKUs</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your single-store inventory, variants, custom fields, and bulk CSV operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product</span>
          </Link>
        </div>
      </div>

      {/* Client List with Search, Filter & CSV Import Modal */}
      <ProductListClient
        initialProducts={products}
        categories={categories}
      />
    </div>
  );
}