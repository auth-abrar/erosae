import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';
import { PurchasingService } from '@/lib/services/purchasing-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const guard = await AuthGuard.requireAdmin('inventory.view');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        goodsReceipts: {
          include: { warehouse: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, purchaseOrders, suppliers });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const guard = await AuthGuard.requireAdmin('inventory.adjust');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const body = await request.json();
    const { action, supplierId, expectedDate, notes, items, purchaseOrderId, warehouseId, receivedItems } = body;

    // Action 1: Create PO
    if (action === 'CREATE_PO') {
      const po = await PurchasingService.createPurchaseOrder({
        supplierId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        items,
      });

      return NextResponse.json({ success: true, message: `Purchase order #${po.poNumber} created.`, purchaseOrder: po });
    }

    // Action 2: Receive Goods into Warehouse
    if (action === 'RECEIVE_GOODS') {
      const receipt = await PurchasingService.receiveGoods({
        purchaseOrderId,
        warehouseId,
        receivedById: guard.session.adminId,
        notes,
        receivedItems,
      });

      return NextResponse.json({ success: true, message: `Goods received into warehouse (GR #${receipt.receiptNumber}).`, receipt });
    }

    return NextResponse.json({ success: false, message: 'Invalid purchasing action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Purchases API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
