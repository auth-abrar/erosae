import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';
import { Money } from '@/lib/money';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Enforce Server-Side Admin Authentication & Permission
    const guard = await AuthGuard.requireAdmin('catalog.create');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const body = await request.json();
    const {
      titleEn,
      titleBn,
      slug,
      descriptionEn,
      descriptionBn,
      basePriceBDT,
      sku,
      brand,
      categoryId,
      image,
      stock,
      type = 'PHYSICAL',
      customFields,
    } = body;

    // 2. Input Validation
    if (!titleEn || !titleBn) {
      return NextResponse.json(
        { success: false, message: 'Both English and Bengali product titles are required.' },
        { status: 400 }
      );
    }

    if (!sku || typeof sku !== 'string') {
      return NextResponse.json(
        { success: false, message: 'A valid unique SKU is required.' },
        { status: 400 }
      );
    }

    const price = Money.round(parseFloat(basePriceBDT) || 0);
    if (price <= 0) {
      return NextResponse.json(
        { success: false, message: 'Base price must be greater than ৳0.00.' },
        { status: 400 }
      );
    }

    // Check SKU Uniqueness
    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      return NextResponse.json(
        { success: false, message: `Product with SKU '${sku}' already exists.` },
        { status: 409 }
      );
    }

    // Verify Category
    let validCategoryId = categoryId;
    if (!validCategoryId) {
      const firstCat = await prisma.category.findFirst();
      if (firstCat) validCategoryId = firstCat.id;
    }

    if (!validCategoryId) {
      return NextResponse.json(
        { success: false, message: 'Please select a valid category.' },
        { status: 400 }
      );
    }

    const productSlug = slug || `${sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

    // 3. Database Persistence
    const product = await prisma.product.create({
      data: {
        titleEn,
        titleBn,
        slug: productSlug,
        descriptionEn: descriptionEn || titleEn,
        descriptionBn: descriptionBn || titleBn,
        basePriceBDT: price,
        sku,
        brandId: null,
        categoryId: validCategoryId,
        type: type,
        images: {
          create: [
            {
              url: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
              altEn: titleEn,
              altBn: titleBn,
              isPrimary: true,
            },
          ],
        },
        variants: {
          create: [
            {
              sku: `${sku}-STD`,
              nameEn: 'Standard',
              nameBn: 'স্ট্যান্ডার্ড',
              priceBDT: price,
              stockQuantity: Math.max(0, parseInt(stock) || 50),
              attributesJson: '{}',
            },
          ],
        },
        customFields: {
          create:
            customFields?.map((cf: any) => ({
              fieldKey: cf.key,
              labelEn: cf.labelEn,
              labelBn: cf.labelBn,
              valueEn: cf.valEn,
              valueBn: cf.valBn,
            })) || [],
        },
      },
      include: {
        images: true,
        variants: true,
        customFields: true,
      },
    });

    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        adminUserId: guard.session.adminId,
        action: 'PRODUCT_CREATE',
        resource: 'Product',
        resourceId: product.id,
        beforeState: null,
        afterState: JSON.stringify({ sku: product.sku, price: product.basePriceBDT }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Admin product creation error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Product creation failed.' }, { status: 500 });
  }
}
