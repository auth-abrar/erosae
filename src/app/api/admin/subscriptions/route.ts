import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const guard = await AuthGuard.requireAdmin('catalog.view');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const pools = await prisma.licenseKeyPool.findMany({
      include: {
        product: true,
        keys: true,
      },
    });

    const digitalProducts = await prisma.product.findMany({
      where: {
        type: {
          in: ['DIGITAL', 'SUBSCRIPTION'],
        },
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json({
      success: true,
      pools,
      digitalProducts,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const guard = await AuthGuard.requireAdmin('catalog.edit');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const body = await request.json();
    const { productId, name, rawKeys } = body;

    if (!productId || !rawKeys || typeof rawKeys !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Product ID and raw license keys list are required.' },
        { status: 400 }
      );
    }

    // Split newline/comma separated keys
    const keysArray = rawKeys
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keysArray.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one valid license key string is required.' },
        { status: 400 }
      );
    }

    const pool = await prisma.$transaction(async (tx) => {
      // Find or create pool
      let existingPool = await tx.licenseKeyPool.findFirst({
        where: { productId },
      });

      if (!existingPool) {
        existingPool = await tx.licenseKeyPool.create({
          data: {
            name: name || 'Standard Activation Key Vault',
            productId,
          },
        });
      }

      // Insert keys
      for (const keyString of keysArray) {
        await tx.licenseKey.create({
          data: {
            poolId: existingPool.id,
            keyEncrypted: keyString,
            status: 'AVAILABLE',
          },
        });
      }

      // Update variant stock quantity if available
      const totalAvailableKeys = await tx.licenseKey.count({
        where: { poolId: existingPool.id, status: 'AVAILABLE' },
      });

      const firstVariant = await tx.productVariant.findFirst({
        where: { productId },
      });

      if (firstVariant) {
        await tx.productVariant.update({
          where: { id: firstVariant.id },
          data: { stockQuantity: totalAvailableKeys },
        });
      }

      return existingPool;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully loaded ${keysArray.length} license keys into pool.`,
      pool,
    });
  } catch (error: any) {
    console.error('Subscriptions POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
