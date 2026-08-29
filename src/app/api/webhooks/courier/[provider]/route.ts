import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const provider = (params.provider || '').toUpperCase();
  const correlationId = `WH-CR-${Date.now()}`;

  try {
    const payload = await request.json();

    const trackingCode = payload.tracking_code || payload.consignment_id || payload.trackingCode || '';
    const rawStatus = (payload.status || payload.delivery_status || '').toUpperCase();

    if (!trackingCode) {
      return NextResponse.json({ success: false, message: 'Missing tracking code or consignment ID.' }, { status: 400 });
    }

    const eventId = payload.eventId || `CR-${provider}-${trackingCode}-${rawStatus}-${Date.now().toString().slice(-4)}`;

    // 1. Idempotency Check
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent && existingEvent.isProcessed) {
      return NextResponse.json({ success: true, isIdempotent: true, message: 'Courier event already processed.' });
    }

    // 2. Normalize Courier Status
    let normalizedStatus = 'IN_TRANSIT';
    if (rawStatus.includes('DELIVER') || rawStatus === 'SUCCESS') {
      normalizedStatus = 'DELIVERED';
    } else if (rawStatus.includes('PICK') || rawStatus === 'RECEIVED') {
      normalizedStatus = 'PICKED_UP';
    } else if (rawStatus.includes('RETURN') || rawStatus === 'CANCEL') {
      normalizedStatus = 'RETURNED';
    }

    // 3. Find and update Shipment
    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [{ trackingCode }, { consignmentId: trackingCode }],
      },
      include: { order: true },
    });

    if (shipment) {
      await prisma.$transaction(async (tx) => {
        await tx.shipment.update({
          where: { id: shipment.id },
          data: {
            status: normalizedStatus,
          },
        });

        // Add Order Timeline
        await tx.orderTimeline.create({
          data: {
            orderId: shipment.orderId,
            status: `SHIPPING_${normalizedStatus}`,
            title: `Courier Update: ${normalizedStatus}`,
            description: `Shipment tracking #${trackingCode} updated via ${provider} webhook.`,
            actorType: 'COURIER',
          },
        });

        // If delivered, update Order fulfillment status
        if (normalizedStatus === 'DELIVERED') {
          await tx.order.update({
            where: { id: shipment.orderId },
            data: {
              fulfillmentStatus: 'FULFILLED',
            },
          });
        }
      });
    }

    // 4. Log Webhook Event
    await prisma.webhookEvent.create({
      data: {
        provider,
        eventId,
        eventType: `COURIER_${normalizedStatus}`,
        payloadJson: JSON.stringify(payload),
        isProcessed: true,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      correlationId,
      message: `Courier status '${normalizedStatus}' updated for tracking code ${trackingCode}.`,
    });
  } catch (error: any) {
    console.error(`[${correlationId}] Courier webhook error for ${provider}:`, error.message);
    return NextResponse.json({ success: false, correlationId, message: error.message }, { status: 400 });
  }
}
