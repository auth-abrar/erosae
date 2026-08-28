import Papa from 'papaparse';
import prisma from './db';

export interface ProductCSVRow {
  sku: string;
  title: string;
  category: string;
  base_price_usd: string | number;
  compare_price_usd?: string | number;
  cost_price_usd?: string | number;
  brand?: string;
  short_description?: string;
  description: string;
  variant_sku?: string;
  variant_title?: string;
  variant_price_offset_usd?: string | number;
  stock_quantity?: string | number;
  attributes_json?: string;
  image_urls?: string; // Semicolon-separated URLs
}

export function generateSampleProductCSV(): string {
  const sampleData: ProductCSVRow[] = [
    {
      sku: 'SAMPLE-TECH-001',
      title: 'Studio Pro Wireless Headphones',
      category: 'Electronics & Gadgets',
      base_price_usd: 149.99,
      compare_price_usd: 199.99,
      cost_price_usd: 65.00,
      brand: 'Acoustic Labs',
      short_description: 'Pure studio sound with 40-hour battery life',
      description: 'Engineered for pristine sound reproduction with memory foam earcups.',
      variant_sku: 'SAMPLE-TECH-001-BLK',
      variant_title: 'Matte Black',
      variant_price_offset_usd: 0,
      stock_quantity: 50,
      attributes_json: '{"Color":"Black"}',
      image_urls: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    },
    {
      sku: 'SAMPLE-TECH-001',
      title: 'Studio Pro Wireless Headphones',
      category: 'Electronics & Gadgets',
      base_price_usd: 149.99,
      compare_price_usd: 199.99,
      cost_price_usd: 65.00,
      brand: 'Acoustic Labs',
      short_description: 'Pure studio sound with 40-hour battery life',
      description: 'Engineered for pristine sound reproduction with memory foam earcups.',
      variant_sku: 'SAMPLE-TECH-001-WHT',
      variant_title: 'Arctic White',
      variant_price_offset_usd: 10,
      stock_quantity: 35,
      attributes_json: '{"Color":"White"}',
      image_urls: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
    },
  ];

  return Papa.unparse(sampleData);
}

export async function exportProductsToCSV(): Promise<string> {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: {
      category: true,
      variants: true,
      images: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows: ProductCSVRow[] = [];

  for (const p of products) {
    const imageUrls = p.images.map((img) => img.url).join(';');

    if (p.variants.length === 0) {
      rows.push({
        sku: p.sku,
        title: p.title,
        category: p.category.name,
        base_price_usd: p.basePriceUSD,
        compare_price_usd: p.compareAtPriceUSD ?? '',
        cost_price_usd: p.costPriceUSD ?? '',
        brand: p.brand ?? '',
        short_description: p.shortDescription ?? '',
        description: p.description,
        variant_sku: '',
        variant_title: '',
        variant_price_offset_usd: 0,
        stock_quantity: 0,
        attributes_json: '',
        image_urls: imageUrls,
      });
    } else {
      for (const v of p.variants) {
        rows.push({
          sku: p.sku,
          title: p.title,
          category: p.category.name,
          base_price_usd: p.basePriceUSD,
          compare_price_usd: p.compareAtPriceUSD ?? '',
          cost_price_usd: p.costPriceUSD ?? '',
          brand: p.brand ?? '',
          short_description: p.shortDescription ?? '',
          description: p.description,
          variant_sku: v.sku,
          variant_title: v.title,
          variant_price_offset_usd: v.priceOffsetUSD,
          stock_quantity: v.stockQuantity,
          attributes_json: v.attributes,
          image_urls: imageUrls,
        });
      }
    }
  }

  return Papa.unparse(rows);
}

export async function importProductsFromCSV(csvText: string): Promise<{
  successCount: number;
  errorCount: number;
  errors: string[];
}> {
  const parsed = Papa.parse<ProductCSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors && parsed.errors.length > 0) {
    return {
      successCount: 0,
      errorCount: parsed.errors.length,
      errors: parsed.errors.map((e) => `Row ${e.row}: ${e.message}`),
    };
  }

  let successCount = 0;
  const errors: string[] = [];

  // Group rows by product SKU
  const productGroups = new Map<string, ProductCSVRow[]>();

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const sku = row.sku?.trim();
    if (!sku) {
      errors.push(`Row ${i + 2}: Missing required 'sku'`);
      continue;
    }
    if (!row.title?.trim()) {
      errors.push(`Row ${i + 2} (${sku}): Missing required 'title'`);
      continue;
    }
    if (!row.category?.trim()) {
      errors.push(`Row ${i + 2} (${sku}): Missing required 'category'`);
      continue;
    }

    if (!productGroups.has(sku)) {
      productGroups.set(sku, []);
    }
    productGroups.get(sku)!.push(row);
  }

  for (const [sku, rows] of productGroups.entries()) {
    try {
      const first = rows[0];
      const categoryName = first.category.trim();
      const slug = first.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // Find or create category
      let category = await prisma.category.findFirst({
        where: { name: categoryName },
      });

      if (!category) {
        const catSlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        category = await prisma.category.create({
          data: {
            name: categoryName,
            slug: catSlug,
          },
        });
      }

      const basePrice = parseFloat(String(first.base_price_usd)) || 0;
      const comparePrice = first.compare_price_usd ? parseFloat(String(first.compare_price_usd)) : null;
      const costPrice = first.cost_price_usd ? parseFloat(String(first.cost_price_usd)) : null;

      // Upsert product
      const product = await prisma.product.upsert({
        where: { sku },
        update: {
          title: first.title.trim(),
          description: first.description || first.title,
          shortDescription: first.short_description || null,
          basePriceUSD: basePrice,
          compareAtPriceUSD: comparePrice,
          costPriceUSD: costPrice,
          brand: first.brand || null,
          categoryId: category.id,
          isActive: true,
        },
        create: {
          sku,
          title: first.title.trim(),
          slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
          description: first.description || first.title,
          shortDescription: first.short_description || null,
          basePriceUSD: basePrice,
          compareAtPriceUSD: comparePrice,
          costPriceUSD: costPrice,
          brand: first.brand || null,
          categoryId: category.id,
          isActive: true,
        },
      });

      // Handle images
      if (first.image_urls) {
        const urls = first.image_urls.split(';').map((u) => u.trim()).filter(Boolean);
        for (let idx = 0; idx < urls.length; idx++) {
          const u = urls[idx];
          const exists = await prisma.productImage.findFirst({
            where: { productId: product.id, url: u },
          });
          if (!exists) {
            await prisma.productImage.create({
              data: {
                productId: product.id,
                url: u,
                isPrimary: idx === 0,
                sortOrder: idx,
              },
            });
          }
        }
      }

      // Handle variants
      for (const r of rows) {
        const variantSku = r.variant_sku?.trim();
        if (variantSku) {
          const variantTitle = r.variant_title?.trim() || 'Default';
          const priceOffset = parseFloat(String(r.variant_price_offset_usd)) || 0;
          const stock = parseInt(String(r.stock_quantity), 10) || 0;
          const attributes = r.attributes_json?.trim() || '{}';

          await prisma.productVariant.upsert({
            where: { sku: variantSku },
            update: {
              title: variantTitle,
              priceOffsetUSD: priceOffset,
              stockQuantity: stock,
              attributes,
            },
            create: {
              productId: product.id,
              sku: variantSku,
              title: variantTitle,
              priceOffsetUSD: priceOffset,
              stockQuantity: stock,
              attributes,
            },
          });
        }
      }

      successCount++;
    } catch (err: any) {
      errors.push(`SKU ${sku}: ${err.message || 'Failed to process product'}`);
    }
  }

  return {
    successCount,
    errorCount: errors.length,
    errors,
  };
}