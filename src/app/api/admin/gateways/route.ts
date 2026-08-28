import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkAdminPermission } from '@/lib/rbac';
import { encryptData, decryptData, maskSecret } from '@/lib/encryption';

export async function GET() {
  try {
    await checkAdminPermission('PAYMENTS', 'VIEW');
    const gateways = await prisma.paymentGateway.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    const sanitizedGateways = gateways.map((g) => {
      let config: any = {};
      try {
        const decrypted = decryptData(g.encryptedConfig);
        config = JSON.parse(decrypted || '{}');
      } catch {}

      // Mask sensitive secret keys
      const maskedConfig: Record<string, any> = { ...config };
      if (maskedConfig.secretKey) maskedConfig.secretKey = maskSecret(maskedConfig.secretKey);
      if (maskedConfig.apiKey) maskedConfig.apiKey = maskSecret(maskedConfig.apiKey);
      if (maskedConfig.hmacSecret) maskedConfig.hmacSecret = maskSecret(maskedConfig.hmacSecret);
      if (maskedConfig.webhookSecret) maskedConfig.webhookSecret = maskSecret(maskedConfig.webhookSecret);

      return {
        id: g.id,
        name: g.name,
        slug: g.slug,
        driver: g.driver,
        isEnabled: g.isEnabled,
        isTestMode: g.isTestMode,
        supportedCurrencies: JSON.parse(g.supportedCurrencies || '["*"]'),
        supportedCountries: JSON.parse(g.supportedCountries || '["*"]'),
        config: maskedConfig,
        displayOrder: g.displayOrder,
      };
    });

    return NextResponse.json({ gateways: sanitizedGateways });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await checkAdminPermission('PAYMENTS', 'EDIT');
    const body = await req.json();
    const { id, isEnabled, isTestMode, supportedCurrencies, supportedCountries, config } = body;

    const existing = await prisma.paymentGateway.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 });
    }

    // Preserve existing unmasked secrets if user left masked value in UI
    let existingConfig: any = {};
    try {
      existingConfig = JSON.parse(decryptData(existing.encryptedConfig) || '{}');
    } catch {}

    const updatedConfig = { ...existingConfig, ...config };
    for (const key of ['secretKey', 'apiKey', 'hmacSecret', 'webhookSecret']) {
      if (config[key] && config[key].startsWith('••••')) {
        updatedConfig[key] = existingConfig[key]; // Preserve existing decrypted secret
      }
    }

    const encryptedConfig = encryptData(JSON.stringify(updatedConfig));

    const updated = await prisma.paymentGateway.update({
      where: { id },
      data: {
        isEnabled: isEnabled !== undefined ? isEnabled : existing.isEnabled,
        isTestMode: isTestMode !== undefined ? isTestMode : existing.isTestMode,
        supportedCurrencies: supportedCurrencies ? JSON.stringify(supportedCurrencies) : existing.supportedCurrencies,
        supportedCountries: supportedCountries ? JSON.stringify(supportedCountries) : existing.supportedCountries,
        encryptedConfig,
      },
    });

    return NextResponse.json({ success: true, gateway: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await checkAdminPermission('PAYMENTS', 'CREATE');
    const body = await req.json();
    const { name, slug, supportedCurrencies, supportedCountries, config } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const encryptedConfig = encryptData(JSON.stringify(config || {}));

    const gateway = await prisma.paymentGateway.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
        driver: 'CUSTOM_STRUCTURED',
        isEnabled: true,
        isTestMode: true,
        supportedCurrencies: JSON.stringify(supportedCurrencies || ['*']),
        supportedCountries: JSON.stringify(supportedCountries || ['*']),
        encryptedConfig,
      },
    });

    return NextResponse.json({ success: true, gateway });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}