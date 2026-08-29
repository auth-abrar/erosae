export interface BarcodePayload {
  format: 'CODE128' | 'EAN13' | 'QR';
  value: string;
  displayValue: string;
  metadata?: Record<string, any>;
}

export class BarcodeService {
  /**
   * Computes an EAN-13 check digit.
   */
  public static calculateEan13CheckDigit(twelveDigits: string): number {
    if (!/^\d{12}$/.test(twelveDigits)) {
      throw new Error('EAN-13 base must be exactly 12 numeric digits');
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(twelveDigits[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }

    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
  }

  /**
   * Generates a valid standard 13-digit EAN-13 code with check digit.
   */
  public static generateEan13(prefix: string = '200', uniqueId: number): string {
    const padded = uniqueId.toString().padStart(9, '0');
    const base = `${prefix}${padded}`.slice(0, 12);
    const checkDigit = this.calculateEan13CheckDigit(base);
    return `${base}${checkDigit}`;
  }

  /**
   * Generates a Code-128 barcode payload for SKUs, Orders, Shipments, or Packages.
   */
  public static generateCode128(identifier: string, type: 'SKU' | 'ORDER' | 'SHIPMENT' | 'PKG' | 'LOC' = 'SKU'): BarcodePayload {
    const sanitized = identifier.trim().toUpperCase();
    return {
      format: 'CODE128',
      value: sanitized,
      displayValue: `${type}:${sanitized}`,
      metadata: { type, generatedAt: new Date().toISOString() },
    };
  }

  /**
   * Generates a secure QR Code payload for tracking or parcel verification without exposing secrets.
   */
  public static generateQrCode(entityType: 'ORDER' | 'SHIPMENT' | 'PRODUCT', entityId: string, publicRef: string): BarcodePayload {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://erosae.com';
    let targetUrl = `${baseUrl}`;

    if (entityType === 'ORDER') {
      targetUrl = `${baseUrl}/account?orderId=${encodeURIComponent(publicRef)}`;
    } else if (entityType === 'SHIPMENT') {
      targetUrl = `${baseUrl}/account?tracking=${encodeURIComponent(publicRef)}`;
    } else if (entityType === 'PRODUCT') {
      targetUrl = `${baseUrl}/products/${encodeURIComponent(publicRef)}`;
    }

    return {
      format: 'QR',
      value: targetUrl,
      displayValue: publicRef,
      metadata: { entityType, entityId, publicRef },
    };
  }

  /**
   * Validates a scanned barcode against an expected SKU, Barcode, or Serial Number.
   */
  public static verifyScanMatch(scannedCode: string, expectedIdentifiers: string[]): boolean {
    if (!scannedCode || !expectedIdentifiers || expectedIdentifiers.length === 0) {
      return false;
    }

    const cleanScan = scannedCode.trim().toUpperCase();
    return expectedIdentifiers.some((id) => id && id.trim().toUpperCase() === cleanScan);
  }
}
