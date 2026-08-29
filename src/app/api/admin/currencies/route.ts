import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';
import { SvgSanitizer } from '@/lib/svg-sanitizer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currencies = await prisma.currency.findMany({
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    });
    return NextResponse.json({ success: true, currencies });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const guard = await AuthGuard.requireAdmin('settings.manage');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const body = await request.json();
    const {
      code,
      nameEn,
      nameBn,
      symbol,
      symbolPosition = 'BEFORE',
      decimalPlaces = 2,
      exchangeRateToBDT,
      isActive = true,
      customSvg,
    } = body;

    if (!code || typeof code !== 'string' || code.trim().length !== 3) {
      return NextResponse.json(
        { success: false, message: 'Currency code must be a 3-letter ISO code (e.g. BDT, USD, MYR).' },
        { status: 400 }
      );
    }

    const cleanCode = code.toUpperCase().trim();
    const rate = parseFloat(exchangeRateToBDT);

    if (isNaN(rate) || rate <= 0) {
      return NextResponse.json(
        { success: false, message: 'Exchange rate to BDT must be a positive number.' },
        { status: 400 }
      );
    }

    // Validate and sanitize custom SVG if provided
    let sanitizedSvg: string | null = null;
    if (customSvg && typeof customSvg === 'string' && customSvg.trim().length > 0) {
      try {
        sanitizedSvg = SvgSanitizer.sanitize(customSvg);
      } catch (err: any) {
        return NextResponse.json(
          { success: false, message: `SVG Validation Error: ${err.message}` },
          { status: 400 }
        );
      }
    }

    const currency = await prisma.currency.upsert({
      where: { code: cleanCode },
      update: {
        nameEn: nameEn || cleanCode,
        nameBn: nameBn || cleanCode,
        symbol: symbol || cleanCode,
        symbolPosition: symbolPosition === 'AFTER' ? 'AFTER' : 'BEFORE',
        decimalPlaces: parseInt(decimalPlaces) || 2,
        exchangeRateToBDT: cleanCode === 'BDT' ? 1.0 : rate,
        isActive: Boolean(isActive),
      },
      create: {
        code: cleanCode,
        nameEn: nameEn || cleanCode,
        nameBn: nameBn || cleanCode,
        symbol: symbol || cleanCode,
        symbolPosition: symbolPosition === 'AFTER' ? 'AFTER' : 'BEFORE',
        decimalPlaces: parseInt(decimalPlaces) || 2,
        exchangeRateToBDT: cleanCode === 'BDT' ? 1.0 : rate,
        isDefault: cleanCode === 'BDT',
        isActive: Boolean(isActive),
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        adminUserId: guard.session.adminId,
        action: 'CURRENCY_UPDATE',
        resource: 'Currency',
        resourceId: currency.id,
        beforeState: null,
        afterState: JSON.stringify({ code: currency.code, rate: currency.exchangeRateToBDT }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Currency '${cleanCode}' successfully saved to database.`,
      currency,
    });
  } catch (error: any) {
    console.error('Currency POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
