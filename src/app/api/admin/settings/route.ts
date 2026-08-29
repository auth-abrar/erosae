import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS: Record<string, any> = {
  // Store Settings
  'store.name': 'Erosae',
  'store.legalName': 'Erosae International Commerce Ltd.',
  'store.tagline': 'Authentic Multi-Category General Marketplace',
  'store.contactEmail': 'support@erosae.com',
  'store.contactPhone': '+880 1700 000000',
  'store.address': 'Plot 14, Block C, Banani Commercial Area, Dhaka 1213, Bangladesh',
  'store.logoUrl': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
  
  // Localization
  'localization.defaultLanguage': 'en',
  'localization.availableLanguages': ['en', 'bn'],
  'localization.timezone': 'Asia/Dhaka',
  'localization.dateFormat': 'YYYY-MM-DD',

  // Currency
  'currency.default': 'BDT',
  'currency.autoExchangeRate': false,

  // Checkout
  'checkout.allowGuestCheckout': true,
  'checkout.requirePhone': true,
  'checkout.freeShippingThresholdBDT': 3000,
  'checkout.insideDhakaRateBDT': 70,
  'checkout.outsideDhakaRateBDT': 130,

  // Orders
  'orders.prefix': 'ERO',
  'orders.allowCustomerCancellation': true,
  'orders.cancellationWindowMinutes': 60,

  // SEO
  'seo.metaTitle': 'Erosae — Multi-Category General Marketplace',
  'seo.metaDescription': 'Erosae offers premium electronics, fashion, home essentials, and lifestyle goods with regional shipping.',
  'seo.ogImage': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200',

  // Theme & Appearance
  'theme.primaryColor': '#c23c4e',
  'theme.borderRadius': '0.75rem',
  'theme.fontBengali': 'SolaimanLipi',
};

export async function GET() {
  try {
    const guard = await AuthGuard.requireAdmin('settings.manage');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const settingsRecords = await prisma.siteSetting.findMany();
    const settingsMap = { ...DEFAULT_SETTINGS };

    for (const s of settingsRecords) {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    }

    return NextResponse.json({ success: true, settings: settingsMap });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const guard = await AuthGuard.requireAdmin('settings.manage');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Settings object is required.' },
        { status: 400 }
      );
    }

    const updatedKeys: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const [key, value] of Object.entries(settings)) {
        const valueJson = JSON.stringify(value);
        const group = key.split('.')[0] || 'general';

        await tx.siteSetting.upsert({
          where: { key },
          update: { value: valueJson, group },
          create: { key, value: valueJson, group },
        });

        updatedKeys.push(key);
      }

      await tx.auditLog.create({
        data: {
          adminUserId: guard.session.adminId,
          action: 'SETTINGS_UPDATE',
          resource: 'SiteSetting',
          resourceId: 'global',
          beforeState: null,
          afterState: JSON.stringify({ keysUpdated: updatedKeys }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Store settings updated successfully.',
      updatedKeysCount: updatedKeys.length,
    });
  } catch (error: any) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
