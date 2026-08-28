import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkAdminPermission } from '@/lib/rbac';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminPermission('ORDERS', 'EDIT');
    const { id } = await params;
    const { orderStatus, paymentStatus, fulfillmentStatus, trackingNumber, trackingUrl } = await req.json();

    const data: any = {};
    if (orderStatus) data.orderStatus = orderStatus;
    if (paymentStatus) data.paymentStatus = paymentStatus;
    if (fulfillmentStatus) data.fulfillmentStatus = fulfillmentStatus;
    if (trackingNumber !== undefined) data.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) data.trackingUrl = trackingUrl;

    const updated = await prisma.order.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}