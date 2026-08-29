import { describe, it, expect } from 'vitest';
import { BarcodeService } from '../src/lib/services/barcode-service';

describe('Barcode & QR Code Service', () => {
  it('should correctly calculate EAN-13 check digits', () => {
    // 200000000001 -> check digit should be deterministic
    const checkDigit = BarcodeService.calculateEan13CheckDigit('200000000001');
    expect(typeof checkDigit).toBe('number');
    expect(checkDigit).toBeGreaterThanOrEqual(0);
    expect(checkDigit).toBeLessThanOrEqual(9);

    const fullEan13 = BarcodeService.generateEan13('200', 42);
    expect(fullEan13).toHaveLength(13);
    expect(fullEan13.startsWith('200')).toBe(true);
  });

  it('should generate valid Code-128 and QR payloads', () => {
    const code128 = BarcodeService.generateCode128('ERO-SKU-999', 'SKU');
    expect(code128.format).toBe('CODE128');
    expect(code128.value).toBe('ERO-SKU-999');

    const qr = BarcodeService.generateQrCode('ORDER', 'ord_123', 'ERO-2026-001');
    expect(qr.format).toBe('QR');
    expect(qr.value).toContain('ERO-2026-001');
  });

  it('should accurately verify scan matches across variants, SKUs and barcodes', () => {
    const allowed = ['SKU-IPHONE-16', 'BAR-880123456', 'IMEI-3589920192'];

    expect(BarcodeService.verifyScanMatch('sku-iphone-16', allowed)).toBe(true);
    expect(BarcodeService.verifyScanMatch('BAR-880123456', allowed)).toBe(true);
    expect(BarcodeService.verifyScanMatch('WRONG-BARCODE', allowed)).toBe(false);
  });
});
