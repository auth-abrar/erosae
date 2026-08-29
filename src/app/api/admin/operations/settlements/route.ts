import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '@/lib/auth-guard';
import { SettlementService } from '@/lib/services/settlement-service';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await AuthGuard.requireAdmin('shipping.manage');
  if ('errorResponse' in guard) return guard.errorResponse;

  try {
    const reconciliations = await prisma.courierSettlementReconciliation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, reconciliations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await AuthGuard.requireAdmin('shipping.manage');
  if ('errorResponse' in guard) return guard.errorResponse;

  try {
    const body = await req.json();
    const result = await SettlementService.reconcileSettlement(body);
    return NextResponse.json({ success: true, reconciliation: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
