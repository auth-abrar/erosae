import { describe, it, expect } from 'vitest';
import prisma from '../src/lib/db';

describe('Populated Catalog & Storefront Integration Tests', () => {
  it('should verify at least 50 active products in the database with bilingual content', async () => {
    const count = await prisma.product.count({ where: { isPublished: true } });
    expect(count).toBeGreaterThanOrEqual(50);

    const sampleProduct = await prisma.product.findFirst({
      where: { slug: 'mens-executive-oxford-cotton-shirt' },
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
        inventoryItems: true,
      },
    });

    expect(sampleProduct).not.toBeNull();
    expect(sampleProduct?.titleEn).toBe("Men's Executive Oxford Cotton Shirt");
    expect(sampleProduct?.titleBn).toBe('পুরুষদের এক্সিকিউটিভ অক্সফোর্ড কটন শার্ট');
    expect(sampleProduct?.images.length).toBeGreaterThan(0);
    expect(sampleProduct?.variants.length).toBeGreaterThan(0);
    expect(sampleProduct?.inventoryItems.length).toBeGreaterThan(0);
  });

  it('should verify searching products by title or SKU returns matching results', async () => {
    const searchResults = await prisma.product.findMany({
      where: {
        OR: [
          { titleEn: { contains: 'Wireless' } },
          { titleBn: { contains: 'ওয়্যারলেস' } },
          { sku: { contains: 'ERO-ELE' } },
        ],
      },
    });

    expect(searchResults.length).toBeGreaterThan(0);
  });

  it('should verify category filtering isolates respective product segments', async () => {
    const electronicsCat = await prisma.category.findUnique({
      where: { slug: 'electronics-gadgets' },
      include: { products: true },
    });

    expect(electronicsCat).not.toBeNull();
    expect(electronicsCat?.products.length).toBeGreaterThanOrEqual(10);
  });
});
