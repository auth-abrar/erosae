import React from 'react';
import prisma from '@/lib/db';
import { Sliders, Plus, Trash2, Layers } from 'lucide-react';
import CustomFieldsClient from './CustomFieldsClient';

export default async function AdminCustomFieldsPage() {
  const [fields, categories] = await Promise.all([
    prisma.customFieldDefinition.findMany({
      include: {
        targetCategory: true,
        _count: { select: { values: true } },
      },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Custom Fields Engine</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create flexible, schema-free attributes (e.g. "Warranty Period", "Fabric Composition") without code changes.
          </p>
        </div>
      </div>

      <CustomFieldsClient initialFields={fields} categories={categories} />
    </div>
  );
}