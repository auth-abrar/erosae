import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AuthGuard } from '@/lib/auth-guard';
import { GiftCardService } from '@/lib/services/gift-card-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const guard = await AuthGuard.requireAdmin('settings.manage');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const giftCards = await prisma.giftCard.findMany({
      include: {
        ledger: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, giftCards });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const guard = await AuthGuard.requireAdmin('settings.manage');
    if ('errorResponse' in guard) {
      return guard.errorResponse;
    }

    const body = await request.json();
    const { initialValueBDT, recipientEmail, giftMessage, expiresInDays = 365 } = body;

    const giftCard = await GiftCardService.issueGiftCard({
      initialValueBDT: parseFloat(initialValueBDT),
      senderId: guard.session.adminId,
      recipientEmail,
      giftMessage,
      expiresInDays: parseInt(expiresInDays) || 365,
    });

    return NextResponse.json({
      success: true,
      message: `Gift card generated successfully with code '${giftCard.code}'.`,
      giftCard,
    });
  } catch (error: any) {
    console.error('Gift Cards API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
