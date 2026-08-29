import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { PaymentService } from '@/lib/services/payment-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const provider = (params.provider || '').toUpperCase();
  const correlationId = `WH-PAY-${Date.now()}`;

  try {
    let payload: any = {};

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });
    } else {
      const rawText = await request.text();
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = { raw: rawText };
      }
    }

    // 1. Generate or extract Unique Event ID for Idempotency
    const eventId =
      payload.eventId ||
      payload.val_id ||
      payload.tran_id ||
      payload.trxID ||
      payload.paymentID ||
      payload.id ||
      `${provider}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const eventType = payload.eventType || payload.status || payload.type || 'PAYMENT_EVENT';

    // 2. Check Idempotency in WebhookEvent ledger
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent && existingEvent.isProcessed) {
      return NextResponse.json({
        success: true,
        isIdempotent: true,
        message: `Webhook event '${eventId}' was already processed.`,
      });
    }

    // Create or update WebhookEvent
    const webhookRecord = await prisma.webhookEvent.upsert({
      where: { eventId },
      create: {
        provider,
        eventId,
        eventType,
        payloadJson: JSON.stringify(payload),
        isProcessed: false,
      },
      update: {
        eventType,
        payloadJson: JSON.stringify(payload),
      },
    });

    // 3. Process and confirm payment via PaymentService
    const result = await PaymentService.verifyAndConfirmPayment({
      gatewayCode: provider,
      payload,
      transactionRef: payload.tran_id || payload.trxID || payload.val_id || payload.paymentID,
    });

    // 4. Mark WebhookEvent as processed
    await prisma.webhookEvent.update({
      where: { id: webhookRecord.id },
      data: {
        isProcessed: true,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      correlationId,
      message: result.message,
      orderId: result.orderId,
    });
  } catch (error: any) {
    console.error(`[${correlationId}] Payment webhook error for ${provider}:`, error.message);

    return NextResponse.json(
      {
        success: false,
        correlationId,
        message: error.message || 'Error processing payment webhook.',
      },
      { status: 400 }
    );
  }
}
