import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const currencies = await prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    const ratesRecords = await prisma.exchangeRate.findMany();
    const rates: Record<string, number> = {};
    for (const r of ratesRecords) {
      rates[r.currencyCode] = r.rateToBase;
    }

    return NextResponse.json({ currencies, rates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}