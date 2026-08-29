import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession, getUserSession, hasPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        shipments: true,
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    // Access Authorization Check
    const adminSession = await getAdminSession();
    const userSession = await getUserSession();

    const isAdmin = adminSession && hasPermission(adminSession, 'orders.view');
    const isOwner = userSession && userSession.userId === order.userId;
    const isGuestRecentOrder = !order.userId; // Guest invoices viewable by orderId token

    if (!isAdmin && !isOwner && !isGuestRecentOrder) {
      return NextResponse.json(
        { success: false, message: 'Access denied to this order.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
