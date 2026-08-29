import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession, getUserSession, hasPermission } from '@/lib/auth';
import { AuthGuard } from '@/lib/auth-guard';
import { OrderStateMachine, OrderStatus, PaymentStatus } from '@/lib/order-state-machine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders
 * Returns orders based on caller identity:
 * - Admin: All orders
 * - Customer: Only orders belonging to the customer's authenticated userId
 * - Anonymous: 401 Unauthorized
 */
export async function GET(request: Request) {
  try {
    const adminSession = await getAdminSession();
    const userSession = await getUserSession();

    if (!adminSession && !userSession) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to view orders.' },
        { status: 401 }
      );
    }

    let orders;

    if (adminSession && hasPermission(adminSession, 'orders.view')) {
      // Staff / Admin access
      orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              assignedLicenseKeys: true,
            },
          },
          payments: true,
          shipments: true,
        },
      });
    } else if (userSession) {
      // Customer access isolated strictly to user's own orders
      orders = await prisma.order.findMany({
        where: { userId: userSession.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              assignedLicenseKeys: true,
            },
          },
          payments: true,
          shipments: true,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Insufficient permissions.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/orders
 * Admin-only order status updater enforcing state machine rules, stock restoration, and license key fulfillment
 */
export async function PATCH(request: Request) {
  try {
    const guard = await AuthGuard.requireAdmin('orders.process');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const body = await request.json();
    const { orderId, status, paymentStatus, adminNotes } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'orderId is required.' },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: 'Order not found.' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Enforce Order Status Transition
    if (status && status !== existingOrder.status) {
      OrderStateMachine.assertOrderTransition(
        existingOrder.status as OrderStatus,
        status as OrderStatus
      );
      updateData.status = status;
    }

    // Enforce Payment Status Transition
    if (paymentStatus && paymentStatus !== existingOrder.paymentStatus) {
      OrderStateMachine.assertPaymentTransition(
        existingOrder.paymentStatus as PaymentStatus,
        paymentStatus as PaymentStatus
      );
      updateData.paymentStatus = paymentStatus;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Stock Restoration on Cancellation or Return
      if (status === 'CANCELLED' || status === 'RETURNED') {
        for (const item of existingOrder.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockQuantity: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      // 2. Digital License Key Automatic Assignment on Payment/Completion
      if (paymentStatus === 'PAID' || status === 'PROCESSING' || status === 'COMPLETED') {
        for (const item of existingOrder.items) {
          if (item.productType === 'DIGITAL' || item.productType === 'SUBSCRIPTION') {
            // Find available keys in pool
            const pool = await tx.licenseKeyPool.findFirst({
              where: { productId: item.productId },
            });

            if (pool) {
              const availableKeys = await tx.licenseKey.findMany({
                where: { poolId: pool.id, status: 'AVAILABLE' },
                take: item.quantity,
              });

              for (const keyRecord of availableKeys) {
                await tx.licenseKey.update({
                  where: { id: keyRecord.id },
                  data: {
                    status: 'ASSIGNED',
                    orderItemId: item.id,
                    assignedAt: new Date(),
                  },
                });
              }
            }
          }
        }
      }

      // 3. Update Order
      const order = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: { items: true },
      });

      // 4. Add to Order Timeline
      if (status && status !== existingOrder.status) {
        await tx.orderTimeline.create({
          data: {
            orderId: order.id,
            status: status,
            title: `Status Changed to ${status}`,
            description: `Order status updated by admin ${guard.session.name}`,
            actorType: 'ADMIN',
            actorId: guard.session.adminId,
          },
        });
      }

      // 5. Record Audit Log
      await tx.auditLog.create({
        data: {
          adminUserId: guard.session.adminId,
          action: 'ORDER_STATUS_UPDATE',
          resource: 'Order',
          resourceId: order.id,
          beforeState: JSON.stringify({ status: existingOrder.status, paymentStatus: existingOrder.paymentStatus }),
          afterState: JSON.stringify({ status: order.status, paymentStatus: order.paymentStatus }),
        },
      });

      return order;
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('Orders PATCH error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update order.' },
      { status: 400 }
    );
  }
}
