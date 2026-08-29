import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const guard = await AuthGuard.requireAdmin('inventory.view');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const warehouses = await prisma.warehouse.findMany({
      orderBy: { code: 'asc' },
    });

    const products = await prisma.product.findMany({
      include: {
        variants: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const inventoryItems = await prisma.inventoryItem.findMany({
      include: {
        warehouse: true,
        product: true,
        variant: true,
      },
    });

    const transactions = await prisma.inventoryTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        inventoryItem: {
          include: {
            product: true,
            warehouse: true,
            variant: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      warehouses,
      products,
      inventoryItems,
      transactions,
    });
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
    const { warehouseId, productId, variantId, deltaQuantity, reason = 'MANUAL_ADJUSTMENT', notes } = body;

    const delta = parseInt(deltaQuantity);
    if (!warehouseId || !productId || isNaN(delta) || delta === 0) {
      return NextResponse.json(
        { success: false, message: 'Valid warehouse, product, and non-zero quantity delta required.' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create InventoryItem for this warehouse location
      let item = await tx.inventoryItem.findUnique({
        where: {
          warehouseId_productId_variantId: {
            warehouseId,
            productId,
            variantId: variantId || null,
          },
        },
      });

      if (!item) {
        item = await tx.inventoryItem.create({
          data: {
            warehouseId,
            productId,
            variantId: variantId || null,
            quantityOnHand: 0,
            quantityAvailable: 0,
          },
        });
      }

      const newOnHand = Math.max(0, item.quantityOnHand + delta);
      const newAvailable = Math.max(0, item.quantityAvailable + delta);

      // 2. Update InventoryItem
      const updatedItem = await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          quantityOnHand: newOnHand,
          quantityAvailable: newAvailable,
        },
      });

      // 3. Update variant or product stock level
      if (variantId) {
        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stockQuantity: {
              increment: delta,
            },
          },
        });
      }

      // 4. Create Auditable Inventory Transaction record
      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          type: reason,
          quantityDelta: delta,
          balanceAfter: newOnHand,
          referenceType: 'ADMIN_MANUAL_ADJUSTMENT',
          referenceId: guard.session.adminId,
          notes: notes || `Stock adjusted by ${guard.session.name} (${delta > 0 ? '+' : ''}${delta})`,
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          adminUserId: guard.session.adminId,
          action: 'INVENTORY_ADJUSTMENT',
          resource: 'InventoryItem',
          resourceId: item.id,
          beforeState: JSON.stringify({ onHand: item.quantityOnHand }),
          afterState: JSON.stringify({ onHand: newOnHand, delta }),
        },
      });

      return updatedItem;
    });

    return NextResponse.json({
      success: true,
      message: `Stock successfully adjusted by ${delta > 0 ? '+' : ''}${delta} units.`,
      inventoryItem: result,
    });
  } catch (error: any) {
    console.error('Inventory POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
