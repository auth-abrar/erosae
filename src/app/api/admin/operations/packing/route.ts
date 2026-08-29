import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '@/lib/auth-guard';
import { PackingService } from '@/lib/services/packing-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const guard = await AuthGuard.requireAdmin('shipping.manage');
  if ('errorResponse' in guard) return guard.errorResponse;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'CREATE_PACKAGES') {
      const { shipmentId, packages } = body;
      const created = await PackingService.createShipmentPackages(shipmentId, packages);
      return NextResponse.json({ success: true, packages: created });
    }

    if (action === 'GENERATE_SHIPPING_LABEL') {
      const { shipmentId } = body;
      const label = await PackingService.generateShippingLabel(shipmentId);
      return NextResponse.json({ success: true, label });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
