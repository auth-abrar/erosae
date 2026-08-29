import prisma from '../db';
import { Money } from '../money';

export type ReturnStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PICKUP'
  | 'RECEIVED'
  | 'INSPECTING'
  | 'RESTOCKED'
  | 'REFUNDED'
  | 'EXCHANGED'
  | 'CLOSED';

export class ReturnsService {
  /**
   * Submits a customer RMA return request.
   */
  static async requestReturn(params: {
    orderId: string;
    userId?: string | null;
    reason: string;
    explanation?: string;
    items: { orderItemId: string; quantity: number; condition?: string }[];
  }) {
    const { orderId, userId, reason, explanation, items } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error(`Order #${orderId} not found.`);
    }

    if (!['DELIVERED', 'COMPLETED'].includes(order.status)) {
      throw new Error(`Cannot request a return on an order with status '${order.status}'. Must be DELIVERED or COMPLETED.`);
    }

    // Calculate maximum refund value for requested items
    let refundAmount = 0;
    for (const item of items) {
      const orderItem = order.items.find((i) => i.id === item.orderItemId);
      if (orderItem) {
        refundAmount = Money.add(refundAmount, Money.multiply(orderItem.unitPriceBDT, item.quantity));
      }
    }

    const returnRequest = await prisma.$transaction(async (tx) => {
      const rma = await tx.returnRequest.create({
        data: {
          orderId: order.id,
          userId: userId || null,
          reason,
          explanation: explanation || null,
          refundAmount,
          status: 'REQUESTED',
          items: {
            create: items.map((i) => ({
              orderItemId: i.orderItemId,
              quantity: i.quantity,
              condition: i.condition || 'UNOPENED',
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Add RMA Timeline
      await tx.returnTimeline.create({
        data: {
          returnRequestId: rma.id,
          status: 'REQUESTED',
          comment: `Customer submitted return request for ৳${refundAmount}. Reason: ${reason}`,
          actorId: userId || 'CUSTOMER',
        },
      });

      return rma;
    });

    return returnRequest;
  }

  /**
   * Processes Admin inspection decision and optionally restocks items to warehouse inventory.
   */
  static async processReturnInspection(params: {
    returnRequestId: string;
    adminUserId: string;
    decision: 'APPROVED' | 'REJECTED' | 'RESTOCKED' | 'REFUNDED' | 'EXCHANGED';
    restockWarehouseId?: string;
    adminNotes?: string;
  }) {
    const { returnRequestId, adminUserId, decision, restockWarehouseId, adminNotes } = params;

    const rma = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: {
        items: {
          include: {
            orderItem: true,
          },
        },
        order: true,
      },
    });

    if (!rma) {
      throw new Error(`Return request #${returnRequestId} not found.`);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Restock items if decision is RESTOCKED or APPROVED for restock
      if ((decision === 'RESTOCKED' || decision === 'REFUNDED') && restockWarehouseId) {
        for (const item of rma.items) {
          if (item.orderItem.variantId) {
            // Update Warehouse Inventory
            let invItem = await tx.inventoryItem.findFirst({
              where: {
                warehouseId: restockWarehouseId,
                productId: item.orderItem.productId,
                variantId: item.orderItem.variantId,
              },
            });

            if (invItem) {
              const newOnHand = invItem.quantityOnHand + item.quantity;
              await tx.inventoryItem.update({
                where: { id: invItem.id },
                data: {
                  quantityOnHand: newOnHand,
                  quantityAvailable: invItem.quantityAvailable + item.quantity,
                },
              });

              // Log inventory transaction
              await tx.inventoryTransaction.create({
                data: {
                  inventoryItemId: invItem.id,
                  type: 'RETURN_RESTOCK',
                  quantityDelta: item.quantity,
                  balanceAfter: newOnHand,
                  referenceType: 'RETURN_REQUEST',
                  referenceId: rma.id,
                  notes: `Restocked from RMA #${rma.id}`,
                },
              });
            }

            // Update variant global stock
            await tx.productVariant.update({
              where: { id: item.orderItem.variantId },
              data: {
                stockQuantity: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      // 2. Update RMA Status
      const updatedRma = await tx.returnRequest.update({
        where: { id: rma.id },
        data: {
          status: decision,
          adminNotes: adminNotes || null,
        },
      });

      // 3. Add to RMA Timeline
      await tx.returnTimeline.create({
        data: {
          returnRequestId: rma.id,
          status: decision,
          comment: `Admin updated RMA status to ${decision}. Notes: ${adminNotes || 'None'}`,
          actorId: adminUserId,
        },
      });

      return updatedRma;
    });
  }
}
