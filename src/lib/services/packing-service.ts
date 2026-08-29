import prisma from '@/lib/db';
import { BarcodeService } from './barcode-service';

export interface PackageInput {
  packageNumber: string;
  weightGrams: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export class PackingService {
  /**
   * Creates packages for a shipment with individual scan barcodes.
   */
  public static async createShipmentPackages(shipmentId: string, packages: PackageInput[]) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true },
    });

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    const createdPackages = [];

    for (const pkg of packages) {
      const barcodePayload = BarcodeService.generateCode128(
        `${shipment.order.orderNumber}-${pkg.packageNumber}`,
        'PKG'
      );

      const dimensionsJson =
        pkg.lengthCm && pkg.widthCm && pkg.heightCm
          ? JSON.stringify({
              length: pkg.lengthCm,
              width: pkg.widthCm,
              height: pkg.heightCm,
            })
          : null;

      const created = await prisma.shipmentPackage.create({
        data: {
          shipmentId,
          packageNumber: pkg.packageNumber,
          weightGrams: pkg.weightGrams,
          dimensionsJson,
          barcode: barcodePayload.value,
          trackingCode: shipment.trackingCode,
        },
      });

      createdPackages.push(created);
    }

    // Update order status to PACKED if not already
    await prisma.order.update({
      where: { id: shipment.orderId },
      data: { status: 'PACKED' },
    });

    return createdPackages;
  }

  /**
   * Generates printable shipping label metadata including QR code and barcode.
   */
  public static async generateShippingLabel(shipmentId: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          include: {
            items: {
              include: { product: true },
            },
          },
        },
        packages: true,
      },
    });

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    let parsedAddress: any = {};
    try {
      parsedAddress = JSON.parse(shipment.deliveryAddress || '{}');
    } catch (e) {
      parsedAddress = { address: shipment.deliveryAddress };
    }

    const qrCode = BarcodeService.generateQrCode('SHIPMENT', shipment.id, shipment.trackingCode || shipment.consignmentId || shipment.id);
    const barcode = BarcodeService.generateCode128(shipment.trackingCode || shipment.consignmentId || shipment.id, 'SHIPMENT');

    return {
      storeName: 'Erosae.com',
      orderNumber: shipment.order.orderNumber,
      courier: shipment.courierCode,
      trackingCode: shipment.trackingCode || shipment.consignmentId,
      recipientName: parsedAddress.fullName || parsedAddress.name || 'Valued Customer',
      recipientPhone: shipment.recipientPhone,
      address: parsedAddress.streetAddress || parsedAddress.address || shipment.deliveryAddress,
      city: parsedAddress.city || 'Dhaka',
      codAmountBDT: shipment.codAmountBDT,
      packagesCount: shipment.packages.length || 1,
      itemsSummary: shipment.order.items.map((i) => `${i.product.titleEn} (x${i.quantity})`).join(', '),
      barcode: barcode.value,
      qrCodeUrl: qrCode.value,
      instructions: 'Please handle with care. Fragile ecommerce consignment.',
    };
  }
}
