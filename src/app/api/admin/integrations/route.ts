import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';
import { PaymentAdapterRegistry } from '@/lib/adapters/payment-adapter';
import { CourierAdapterRegistry } from '@/lib/adapters/courier-adapter';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const guard = await AuthGuard.requireAdmin('settings.manage');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const paymentGateways = await prisma.paymentGatewayConfig.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const couriers = await prisma.courierConfig.findMany();

    const recentWebhooks = await prisma.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Mask sensitive encrypted credentials
    const safePaymentGateways = paymentGateways.map((g) => ({
      ...g,
      credentialsEnc: g.credentialsEnc ? 'CONFIGURED [PROTECTED]' : 'NOT CONFIGURED',
    }));

    const safeCouriers = couriers.map((c) => ({
      ...c,
      credentialsEnc: c.credentialsEnc ? 'CONFIGURED [PROTECTED]' : 'NOT CONFIGURED',
    }));

    return NextResponse.json({
      success: true,
      paymentGateways: safePaymentGateways,
      couriers: safeCouriers,
      recentWebhooks,
    });
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
    const { action, type, provider } = body;

    if (action === 'TEST_CONNECTION') {
      if (type === 'PAYMENT') {
        const adapter = PaymentAdapterRegistry.getAdapter(provider);
        const result = await adapter.testConnection();
        return NextResponse.json({ success: true, result });
      }

      if (type === 'COURIER') {
        const adapter = CourierAdapterRegistry.getAdapter(provider);
        const result = await adapter.testConnection();
        return NextResponse.json({ success: true, result });
      }
    }

    return NextResponse.json({ success: false, message: 'Invalid integration action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Integrations API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
