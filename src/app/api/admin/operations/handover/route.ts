import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '@/lib/auth-guard';
import { HandoverService } from '@/lib/services/handover-service';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await AuthGuard.requireAdmin('shipping.manage');
  if ('errorResponse' in guard) return guard.errorResponse;

  try {
    const sessions = await prisma.courierHandoverSession.findMany({
      include: {
        items: {
          include: {
            shipment: {
              include: { order: true },
            },
          },
        },
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await AuthGuard.requireAdmin('shipping.manage');
  if ('errorResponse' in guard) return guard.errorResponse;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'START_SESSION') {
      const { courierCode, warehouseId } = body;
      const session = await HandoverService.startHandoverSession(courierCode, warehouseId, guard.session.adminId);
      return NextResponse.json({ success: true, session });
    }

    if (action === 'SCAN_PARCEL') {
      const { sessionId, trackingCode } = body;
      const result = await HandoverService.scanParcelToSession(sessionId, trackingCode);
      return NextResponse.json(result);
    }

    if (action === 'CONFIRM_MANIFEST') {
      const { sessionId } = body;
      const session = await HandoverService.confirmHandoverAndGenerateManifest(sessionId);
      return NextResponse.json({ success: true, session });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
