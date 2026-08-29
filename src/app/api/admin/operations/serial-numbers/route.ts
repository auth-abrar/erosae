import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '@/lib/auth-guard';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const guard = await AuthGuard.requireAdmin('inventory.manage');
  if ('errorResponse' in guard) return guard.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    const serials = await prisma.inventorySerialNumber.findMany({
      where: search
        ? {
            OR: [
              { serialNumber: { contains: search } },
              { product: { titleEn: { contains: search } } },
            ],
          }
        : undefined,
      include: {
        product: true,
        variant: true,
        warehouseLocation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, serials });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await AuthGuard.requireAdmin('inventory.manage');
  if ('errorResponse' in guard) return guard.errorResponse;

  try {
    const body = await req.json();
    const { productId, variantId, serialNumbers, warehouseLocationId } = body;

    const registered = [];
    for (const sn of serialNumbers) {
      const cleanSn = sn.trim();
      const existing = await prisma.inventorySerialNumber.findUnique({
        where: { serialNumber: cleanSn },
      });

      if (existing) {
        throw new Error(`Serial number "${cleanSn}" is already registered in the system.`);
      }

      const item = await prisma.inventorySerialNumber.create({
        data: {
          productId,
          variantId,
          serialNumber: cleanSn,
          status: 'RECEIVED',
          warehouseLocationId,
        },
      });

      registered.push(item);
    }

    return NextResponse.json({ success: true, registered });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
