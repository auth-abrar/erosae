import prisma from '@/lib/db';
import { BarcodeService } from './barcode-service';

export interface PickScanResult {
  success: boolean;
  message: string;
  isItemComplete: boolean;
  isPickListComplete: boolean;
  item?: any;
}

export class PickingService {
  /**
   * Generates a pick list for an order or a batch of orders.
   */
  public static async createPickList(orderIds: string[], type: 'SINGLE_ORDER' | 'BATCH_PICK' = 'SINGLE_ORDER', staffId?: string) {
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: { in: orderIds } },
      include: {
        product: true,
        variant: true,
      },
    });

    if (orderItems.length === 0) {
      throw new Error('No items found for the specified orders');
    }

    const pickNumber = `PICK-${Date.now().toString().slice(-6)}`;

    const pickList = await prisma.pickList.create({
      data: {
        pickNumber,
        type,
        status: 'IN_PROGRESS',
        assignedStaffId: staffId,
        items: {
          create: orderItems.map((item) => ({
            orderItemId: item.id,
            productId: item.productId,
            variantId: item.variantId,
            quantityOrdered: item.quantity,
            quantityPicked: 0,
            isVerified: false,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    return pickList;
  }

  /**
   * Verifies an item scan during warehouse picking against the pick list item.
   */
  public static async scanItem(
    pickListId: string,
    scannedBarcodeOrSku: string,
    quantity: number = 1
  ): Promise<PickScanResult> {
    const pickList = await prisma.pickList.findUnique({
      where: { id: pickListId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!pickList) {
      return {
        success: false,
        message: 'Pick list not found',
        isItemComplete: false,
        isPickListComplete: false,
      };
    }

    // Locate the matching item in the pick list
    const targetItem = pickList.items.find((item) => {
      const allowedIdentifiers = [
        item.product.sku,
        item.product.barcode || '',
        item.variant?.sku || '',
        item.variant?.barcode || '',
      ].filter(Boolean);

      return (
        BarcodeService.verifyScanMatch(scannedBarcodeOrSku, allowedIdentifiers) &&
        item.quantityPicked < item.quantityOrdered
      );
    });

    if (!targetItem) {
      return {
        success: false,
        message: `⚠️ WRONG ITEM SCANNED! Barcode "${scannedBarcodeOrSku}" does not match any pending item in this pick list.`,
        isItemComplete: false,
        isPickListComplete: false,
      };
    }

    const newPickedQty = targetItem.quantityPicked + quantity;
    const isItemComplete = newPickedQty >= targetItem.quantityOrdered;

    const updatedItem = await prisma.pickListItem.update({
      where: { id: targetItem.id },
      data: {
        quantityPicked: newPickedQty,
        isVerified: isItemComplete,
      },
    });

    // Check if entire pick list is completed
    const allPending = pickList.items.filter((i) => i.id !== targetItem.id && !i.isVerified);
    const isPickListComplete = isItemComplete && allPending.length === 0;

    if (isPickListComplete) {
      await prisma.pickList.update({
        where: { id: pickListId },
        data: { status: 'COMPLETED' },
      });
    }

    return {
      success: true,
      message: `✅ Verified: ${targetItem.product.titleEn} (${newPickedQty}/${targetItem.quantityOrdered})`,
      isItemComplete,
      isPickListComplete,
      item: updatedItem,
    };
  }
}
