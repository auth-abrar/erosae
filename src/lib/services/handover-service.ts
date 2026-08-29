import prisma from '@/lib/db';

export class HandoverService {
  /**
   * Starts or opens a new Courier Handover Session.
   */
  public static async startHandoverSession(courierCode: string, warehouseId: string, staffId?: string) {
    const sessionNumber = `HND-${Date.now().toString().slice(-6)}`;

    return await prisma.courierHandoverSession.create({
      data: {
        sessionNumber,
        courierCode,
        warehouseId,
        status: 'OPEN',
        staffId,
      },
    });
  }

  /**
   * Scans a parcel into the handover session with duplicate prevention.
   */
  public static async scanParcelToSession(sessionId: string, scannedTrackingOrBarcode: string) {
    const session = await prisma.courierHandoverSession.findUnique({
      where: { id: sessionId },
      include: { items: true },
    });

    if (!session || session.status !== 'OPEN') {
      throw new Error('Handover session is closed or invalid');
    }

    const cleanCode = scannedTrackingOrBarcode.trim();

    // Check if parcel was already scanned in this session
    const isAlreadyScanned = session.items.some((i) => i.trackingCode === cleanCode);
    if (isAlreadyScanned) {
      throw new Error(`⚠️ DUPLICATE SCAN! Tracking number ${cleanCode} is already recorded in this handover session.`);
    }

    // Find the matching shipment
    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          { trackingCode: cleanCode },
          { consignmentId: cleanCode },
          { id: cleanCode },
        ],
      },
    });

    if (!shipment) {
      throw new Error(`⚠️ UNKNOWN PARCEL: No shipment found with tracking code "${cleanCode}".`);
    }

    const item = await prisma.courierHandoverItem.create({
      data: {
        sessionId,
        shipmentId: shipment.id,
        trackingCode: cleanCode,
        codAmountBDT: shipment.codAmountBDT || 0.0,
      },
    });

    // Update totals on session
    const updatedSession = await prisma.courierHandoverSession.update({
      where: { id: sessionId },
      data: {
        totalParcels: session.totalParcels + 1,
        totalCodBDT: session.totalCodBDT + (shipment.codAmountBDT || 0.0),
      },
    });

    // Update shipment state to PICKED_UP
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: 'PICKED_UP' },
    });

    return {
      success: true,
      item,
      sessionTotals: {
        parcels: updatedSession.totalParcels,
        totalCodBDT: updatedSession.totalCodBDT,
      },
    };
  }

  /**
   * Confirms the handover session and generates an immutable manifest.
   */
  public static async confirmHandoverAndGenerateManifest(sessionId: string) {
    const session = await prisma.courierHandoverSession.findUnique({
      where: { id: sessionId },
      include: {
        items: {
          include: {
            shipment: {
              include: { order: true },
            },
          },
        },
        warehouse: true,
      },
    });

    if (!session) {
      throw new Error('Handover session not found');
    }

    if (session.status === 'CONFIRMED') {
      return session;
    }

    return await prisma.courierHandoverSession.update({
      where: { id: sessionId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: {
        items: {
          include: {
            shipment: {
              include: { order: true },
            },
          },
        },
        warehouse: true,
      },
    });
  }
}
