import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const whereClause: any = { isApproved: true };
    if (productId) {
      whereClause.productId = productId;
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userSession = await getUserSession();
    if (!userSession) {
      return NextResponse.json({ success: false, message: 'Please log in to submit a review.' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, rating, title, comment } = body;

    const numRating = parseInt(rating);
    if (!productId || isNaN(numRating) || numRating < 1 || numRating > 5 || !comment) {
      return NextResponse.json(
        { success: false, message: 'Product ID, rating (1-5), and review comment are required.' },
        { status: 400 }
      );
    }

    // Check if user has a verified purchase of this product
    const verifiedOrder = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: userSession.userId,
          status: { in: ['DELIVERED', 'COMPLETED'] },
        },
      },
    });

    const isVerified = Boolean(verifiedOrder);

    const review = await prisma.review.create({
      data: {
        productId,
        userId: userSession.userId,
        rating: numRating,
        title: title || null,
        comment,
        isVerified,
        isApproved: true, // Default active for verified
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully.',
      review,
    });
  } catch (error: any) {
    console.error('Reviews API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
