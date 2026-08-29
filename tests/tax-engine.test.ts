import { describe, it, expect } from 'vitest';
import { TaxService } from '../src/lib/services/tax-service';

describe('Tax Engine & Jurisdiction Calculations', () => {
  it('should calculate exclusive VAT correctly (e.g. 5% on ৳1000 = ৳50 tax, ৳1050 total)', () => {
    const res = TaxService.calculateTax({
      amountBDT: 1000.00,
      ratePercent: 5.0,
      isInclusive: false,
    });

    expect(res.taxableAmountBDT).toBe(1000.00);
    expect(res.taxAmountBDT).toBe(50.00);
    expect(res.totalWithTaxBDT).toBe(1050.00);
  });

  it('should extract inclusive VAT correctly (e.g. 15% on ৳1150 = ৳1000 base, ৳150 tax)', () => {
    const res = TaxService.calculateTax({
      amountBDT: 1150.00,
      ratePercent: 15.0,
      isInclusive: true,
    });

    expect(res.taxableAmountBDT).toBe(1000.00);
    expect(res.taxAmountBDT).toBe(150.00);
    expect(res.totalWithTaxBDT).toBe(1150.00);
  });

  it('should return zero tax for 0% exempt rate classes', () => {
    const res = TaxService.calculateTax({
      amountBDT: 2500.00,
      ratePercent: 0.0,
      isInclusive: false,
    });

    expect(res.taxAmountBDT).toBe(0.00);
    expect(res.totalWithTaxBDT).toBe(2500.00);
  });
});
