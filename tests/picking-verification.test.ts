import { describe, it, expect } from 'vitest';
import { BarcodeService } from '../src/lib/services/barcode-service';

describe('Warehouse Order Picking Verification', () => {
  it('should reject wrong-product barcode scans during picking', () => {
    const pickListItem = {
      productSku: 'PROD-TSHIRT-RED-L',
      productBarcode: '8901234567890',
      quantityOrdered: 2,
      quantityPicked: 0,
    };

    const allowedIdentifiers = [pickListItem.productSku, pickListItem.productBarcode];

    // Scanned wrong SKU
    const isMatch = BarcodeService.verifyScanMatch('PROD-TSHIRT-BLUE-M', allowedIdentifiers);
    expect(isMatch).toBe(false);

    // Scanned correct barcode
    const isCorrectMatch = BarcodeService.verifyScanMatch('8901234567890', allowedIdentifiers);
    expect(isCorrectMatch).toBe(true);
  });
});
