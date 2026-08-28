import React from 'react';
import prisma from '@/lib/db';
import { FolderTree, Plus, Edit, Trash2 } from 'lucide-react';
import CategoriesClient from './CategoriesClient';

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      children: true,
      _count: { select: { products: true } },
    },
    orderBy: [{ parentId: 'asc' }, { displayOrder: 'asc' }],
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Multi-Level Categories Tree</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize multi-category departments, parent categories, and deep subcategories.
          </p>
        </div>
      </div>

      <CategoriesClient initialCategories={categories} />
    </div>
  );
}