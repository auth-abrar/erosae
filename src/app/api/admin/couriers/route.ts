import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const couriers = await prisma.courierConfig.findMany({
      orderBy: { code: 'asc' },
    });
    return NextResponse.json({ success: true, couriers });
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
    const { code, name, isEnabled, isLiveMode, credentials, settings } = body;

    if (!code) {
      return NextResponse.json({ success: false, message: 'Courier code is required (e.g. STEADFAST, PATHAO).' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();

    const courier = await prisma.courierConfig.upsert({
      where: { code: cleanCode },
      update: {
        name: name || cleanCode,
        isEnabled: Boolean(isEnabled),
        isLiveMode: Boolean(isLiveMode),
        credentialsEnc: credentials ? JSON.stringify(credentials) : '{}',
        settingsJson: settings ? JSON.stringify(settings) : null,
      },
      create: {
        code: cleanCode,
        name: name || cleanCode,
        isEnabled: Boolean(isEnabled),
        isLiveMode: Boolean(isLiveMode),
        credentialsEnc: credentials ? JSON.stringify(credentials) : '{}',
        settingsJson: settings ? JSON.stringify(settings) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Courier config for '${cleanCode}' updated. (Dispatch remains in DEMO mode until live integration)`,
      courier,
    });
  } catch (error: any) {
    console.error('Courier POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
