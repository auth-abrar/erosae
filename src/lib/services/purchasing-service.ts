import prisma from '../db';
import { Money } from '../money';

export interface PurchaseOrderItemInput {
  productId: string;
  variantId?: string | null;
  quantityOrdered: number;
  unitCostBDT: number;
}

export interface ReceiveItemInput {
  purchaseOrderItemId: string;
  quantityReceived: number;
}

export class PurchasingService {
  /**
   * Creates a Purchase Order for a supplier.
   */
  static async createPurchaseOrder(params: {
    supplierId: string;
    expectedDate?: Date | null;
    notes?: string;
    items: PurchaseOrderItemInput[];
  }) {
    const { supplierId, expectedDate, notes, items } = params;

    if (!supplierId || !items || items.length === 0) {
      throw new Error('Supplier and at least one purchase item are required.');
    }

    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let totalCostBDT = 0;
    const formattedItems = items.map((i) => {
      const lineCost = Money.multiply(i.unitCostBDT, i.quantityOrdered);
      totalCostBDT = Money.add(totalCostBDT, lineCost);
      return {
        productId: i.productId,
        variantId: i.variantId || null,
        quantityOrdered: i.quantityOrdered,
        quantityReceived: 0,
        unitCostBDT: i.unitCostBDT,
        totalCostBDT: lineCost,
      };
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        status: 'ISSUED',
        totalCostBDT,
        expectedDate: expectedDate || null,
        notes: notes || null,
        items: {
          create: formattedItems,
        },
      },
      include: {
        items: {
          include: { product: true, variant: true },
        },
        supplier: true,
      },
    });

    return po;
  }

  /**
   * Receives goods from a Purchase Order into a designated warehouse.
   * Atomically updates inventory on-hand and logs auditable InventoryTransactions.
   */
  static async receiveGoods(params: {
    purchaseOrderId: string;
    warehouseId: string;
    receivedById?: string | null;
    notes?: string;
    receivedItems: ReceiveItemInput[];
  }) {
    const { purchaseOrderId, warehouseId, receivedById, notes, receivedItems } = params;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true },
    });

    if (!po) {
      throw new Error(`Purchase order #${purchaseOrderId} not found.`);
    }

    const receiptNumber = `GR-${Date.now().toString().slice(-6)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Goods Receipt record
      const receipt = await tx.goodsReceipt.create({
        data: {
          receiptNumber,
          purchaseOrderId: po.id,
          warehouseId,
          receivedById: receivedById || null,
          notes: notes || null,
        },
      });

      // 2. Process each received item
      for (const rx of receivedItems) {
        const poItem = po.items.find((i) => i.id === rx.purchaseOrderItemId);
        if (!poItem || rx.quantityReceived <= 0) continue;

        // Update quantity received on PO item
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: {
            quantityReceived: {
              increment: rx.quantityReceived,
            },
          },
        });

        // Find or create InventoryItem in warehouse
        let inventoryItem = await tx.inventoryItem.findFirst({
          where: {
            warehouseId,
            productId: poItem.productId,
            variantId: poItem.variantId || null,
          },
        });

        if (!inventoryItem) {
          inventoryItem = await tx.inventoryItem.create({
            data: {
              warehouseId,
              productId: poItem.productId,
              variantId: poItem.variantId || null,
              quantityOnHand: 0,
              quantityAvailable: 0,
            },
          });
        }

        const newOnHand = inventoryItem.quantityOnHand + rx.quantityReceived;
        const newAvailable = inventoryItem.quantityAvailable + rx.quantityReceived;

        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            quantityOnHand: newOnHand,
            quantityAvailable: newAvailable,
          },
        });

        // Update Variant global stock
        if (poItem.variantId) {
          await tx.productVariant.update({
            where: { id: poItem.variantId },
            data: {
              stockQuantity: {
                increment: rx.quantityReceived,
              },
            },
          });
        }

        // Create Auditable Inventory Transaction log
        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: inventoryItem.id,
            type: 'PURCHASE_RECEIPT',
            quantityDelta: rx.quantityReceived,
            balanceAfter: newOnHand,
            referenceType: 'GOODS_RECEIPT',
            referenceId: receipt.id,
            notes: `Received ${rx.quantityReceived} units against PO #${po.poNumber}`,
          },
        });
      }

      // 3. Update PO overall status (RECEIVED vs PARTIALLY_RECEIVED)
      const updatedPoItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: po.id },
      });

      const allFulfilled = updatedPoItems.every((i) => i.quantityReceived >= i.quantityOrdered);
      const someFulfilled = updatedPoItems.some((i) => i.quantityReceived > 0);

      const nextStatus = allFulfilled ? 'RECEIVED' : someFulfilled ? 'PARTIALLY_RECEIVED' : po.status;

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: nextStatus },
      });

      return receipt;
    });

    return result;
  }
}
