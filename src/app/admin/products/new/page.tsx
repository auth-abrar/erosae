import React from 'react';
import prisma from '@/lib/db';
import ProductEditor from '../ProductEditor';

export default async function NewProductPage() {
  const [categories, customFieldDefs] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.customFieldDefinition.findMany({
      where: { entityType: 'PRODUCT' },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return <ProductEditor categories={categories} customFieldDefs={customFieldDefs} />;
}