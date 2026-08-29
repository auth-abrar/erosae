import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const gateways = await prisma.paymentGatewayConfig.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ success: true, gateways });
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
    const { code, nameEn, nameBn, isEnabled, isLiveMode, supportedCurrencies = ['BDT'], credentials, settings, sortOrder = 0 } = body;

    if (!code) {
      return NextResponse.json({ success: false, message: 'Payment gateway code is required (e.g. BKASH, NAGAD).' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();

    const gateway = await prisma.paymentGatewayConfig.upsert({
      where: { code: cleanCode },
      update: {
        nameEn: nameEn || cleanCode,
        nameBn: nameBn || cleanCode,
        isEnabled: Boolean(isEnabled),
        isLiveMode: Boolean(isLiveMode),
        supportedCurrencies: Array.isArray(supportedCurrencies) ? JSON.stringify(supportedCurrencies) : JSON.stringify(['BDT']),
        credentialsEnc: credentials ? JSON.stringify(credentials) : '{}',
        settingsJson: settings ? JSON.stringify(settings) : null,
        sortOrder: parseInt(sortOrder) || 0,
      },
      create: {
        code: cleanCode,
        nameEn: nameEn || cleanCode,
        nameBn: nameBn || cleanCode,
        isEnabled: Boolean(isEnabled),
        isLiveMode: Boolean(isLiveMode),
        supportedCurrencies: Array.isArray(supportedCurrencies) ? JSON.stringify(supportedCurrencies) : JSON.stringify(['BDT']),
        credentialsEnc: credentials ? JSON.stringify(credentials) : '{}',
        settingsJson: settings ? JSON.stringify(settings) : null,
        sortOrder: parseInt(sortOrder) || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payment gateway config for '${cleanCode}' updated. (Gateway remains in DEMO mode until live integration)`,
      gateway,
    });
  } catch (error: any) {
    console.error('Payment gateway POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
