import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkAdminPermission } from '@/lib/rbac';

export async function GET() {
  try {
    await checkAdminPermission('SETTINGS', 'VIEW');
    const currencies = await prisma.currency.findMany({
      include: {
        exchangeRates: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ currencies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await checkAdminPermission('SETTINGS', 'EDIT');
    const { currencyCode, rateToBase, isActive } = await req.json();

    if (!currencyCode) {
      return NextResponse.json({ error: 'Currency code is required' }, { status: 400 });
    }

    if (isActive !== undefined) {
      await prisma.currency.update({
        where: { code: currencyCode },
        data: { isActive },
      });
    }

    if (rateToBase !== undefined) {
      const existingRate = await prisma.exchangeRate.findFirst({
        where: { currencyCode },
      });

      if (existingRate) {
        await prisma.exchangeRate.update({
          where: { id: existingRate.id },
          data: { rateToBase: parseFloat(rateToBase), source: 'MANUAL' },
        });
      } else {
        await prisma.exchangeRate.create({
          data: {
            currencyCode,
            rateToBase: parseFloat(rateToBase),
            source: 'MANUAL',
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}