import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const guard = await AuthGuard.requireAdmin('crm.manage');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: {
        customerProfile: true,
        loyaltyAccount: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmountBDT: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tickets = await prisma.supportTicket.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      customers,
      tickets,
      coupons,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const guard = await AuthGuard.requireAdmin('crm.manage');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const body = await request.json();
    const { action, ticketId, message, couponCode, discountType, discountValue } = body;

    // 1. Reply to ticket
    if (action === 'REPLY_TICKET') {
      if (!ticketId || !message) {
        return NextResponse.json({ success: false, message: 'Ticket ID and message are required.' }, { status: 400 });
      }

      const newMsg = await prisma.ticketMessage.create({
        data: {
          ticketId,
          senderType: 'STAFF',
          senderId: guard.session.adminId,
          message,
          isInternal: false,
        },
      });

      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'WAITING_CUSTOMER' },
      });

      return NextResponse.json({ success: true, message: 'Reply sent successfully.', ticketMessage: newMsg });
    }

    // 2. Create coupon
    if (action === 'CREATE_COUPON') {
      if (!couponCode || !discountValue) {
        return NextResponse.json({ success: false, message: 'Coupon code and value are required.' }, { status: 400 });
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: couponCode.toUpperCase().trim(),
          discountType: discountType || 'PERCENTAGE',
          discountValue: parseFloat(discountValue),
          minSpendBDT: 1000,
          isActive: true,
        },
      });

      return NextResponse.json({ success: true, message: 'Coupon created successfully.', coupon });
    }

    return NextResponse.json({ success: false, message: 'Invalid CRM action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
