import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '@/lib/auth-guard';
import { PickingService } from '@/lib/services/picking-service';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await AuthGuard.requireAdmin('inventory.manage');
  if ('errorResponse' in guard) return guard.errorResponse;

  try {
    const pickLists = await prisma.pickList.findMany({
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, pickLists });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await AuthGuard.requireAdmin('inventory.manage');
  if ('errorResponse' in guard) return guard.errorResponse;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'CREATE_PICK_LIST') {
      const { orderIds, type } = body;
      const pickList = await PickingService.createPickList(orderIds, type, guard.session.adminId);
      return NextResponse.json({ success: true, pickList });
    }

    if (action === 'SCAN_ITEM') {
      const { pickListId, barcode, quantity } = body;
      const result = await PickingService.scanItem(pickListId, barcode, quantity || 1);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
