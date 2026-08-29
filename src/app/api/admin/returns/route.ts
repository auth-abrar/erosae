import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';
import { ReturnsService } from '@/lib/services/returns-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const guard = await AuthGuard.requireAdmin('orders.process');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const returns = await prisma.returnRequest.findMany({
      include: {
        order: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        items: {
          include: {
            orderItem: true,
          },
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
    });

    return NextResponse.json({ success: true, returns, warehouses });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const guard = await AuthGuard.requireAdmin('orders.process');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const body = await request.json();
    const { returnRequestId, decision, restockWarehouseId, adminNotes } = body;

    const rma = await ReturnsService.processReturnInspection({
      returnRequestId,
      adminUserId: guard.session.adminId,
      decision,
      restockWarehouseId,
      adminNotes,
    });

    return NextResponse.json({
      success: true,
      message: `Return request decision set to '${decision}'.`,
      returnRequest: rma,
    });
  } catch (error: any) {
    console.error('Returns API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
