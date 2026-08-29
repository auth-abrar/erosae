import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const search = searchParams.get('q');
    const type = searchParams.get('type');
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort') || 'newest';

    const whereClause: any = {
      isPublished: true,
      deletedAt: null,
    };

    if (category) {
      whereClause.category = { slug: category };
    }

    if (brand) {
      whereClause.brand = { slug: brand };
    }

    if (type) {
      whereClause.type = type.toUpperCase();
    }

    if (featured === 'true') {
      whereClause.isFeatured = true;
    }

    if (search) {
      whereClause.OR = [
        { titleEn: { contains: search } },
        { titleBn: { contains: search } },
        { descriptionEn: { contains: search } },
        { descriptionBn: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_low') orderBy = { basePriceBDT: 'asc' };
    if (sort === 'price_high') orderBy = { basePriceBDT: 'desc' };
    if (sort === 'popular') orderBy = { ratingAverage: 'desc' };

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        brand: true,
        variants: true,
        subscriptionConfig: true,
      },
      orderBy,
      take: 50,
    });

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
