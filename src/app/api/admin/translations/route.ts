import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const translations = await prisma.translation.findMany({
      orderBy: [{ namespace: 'asc' }, { key: 'asc' }],
    });
    return NextResponse.json({ success: true, translations });
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
    const { key, namespace = 'general', valueEn, valueBn } = body;

    if (!key || !valueEn) {
      return NextResponse.json(
        { success: false, message: 'Translation key and English value are required.' },
        { status: 400 }
      );
    }

    const cleanKey = key.toLowerCase().trim();

    const translation = await prisma.translation.upsert({
      where: {
        key_namespace: {
          key: cleanKey,
          namespace: namespace.toLowerCase().trim(),
        },
      },
      update: {
        valueEn,
        valueBn: valueBn || valueEn,
        isCustomized: true,
      },
      create: {
        key: cleanKey,
        namespace: namespace.toLowerCase().trim(),
        valueEn,
        valueBn: valueBn || valueEn,
        isCustomized: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Translation key '${cleanKey}' saved successfully.`,
      translation,
    });
  } catch (error: any) {
    console.error('Translations POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
