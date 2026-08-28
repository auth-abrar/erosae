import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import ProductEditor from '../ProductEditor';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const [product, categories, customFieldDefs] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        customFieldValues: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.customFieldDefinition.findMany({
      where: { entityType: 'PRODUCT' },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  if (!product || product.deletedAt) {
    notFound();
  }

  return <ProductEditor product={product} categories={categories} customFieldDefs={customFieldDefs} />;
}