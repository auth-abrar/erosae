import { describe, it, expect } from 'vitest';
import { Money } from '../src/lib/money';

describe('Financial Engine & Deterministic Checkout Mathematics', () => {
  it('should eliminate floating-point drift and calculate exact line totals', () => {
    // 0.1 + 0.2 floating point problem check
    const sum = Money.add(0.1, 0.2);
    expect(sum).toBe(0.3);

    const lineTotal = Money.calculateLineTotal(199.99, 3, 50.0);
    expect(lineTotal).toBe(549.97);
  });

  it('should accurately calculate order subtotal, zone shipping, and discounts', () => {
    const orderCalc = Money.calculateOrderTotals({
      items: [
        { unitPriceBDT: 1250.0, quantity: 2 }, // 2500
        { unitPriceBDT: 450.5, quantity: 1 },  // 450.50
      ],
      shippingFeeBDT: 70.0, // Inside Dhaka
      discountBDT: 250.0,
      taxRatePercent: 5.0, // 5% VAT
    });

    expect(orderCalc.subtotalBDT).toBe(2950.5);
    expect(orderCalc.discountBDT).toBe(250.0);
    // Taxable = 2950.50 - 250 = 2700.50. Tax at 5% = 135.03
    expect(orderCalc.taxBDT).toBe(135.03);
    expect(orderCalc.shippingBDT).toBe(70.0);
    // Total = 2700.50 + 70 + 135.03 = 2905.53
    expect(orderCalc.totalBDT).toBe(2905.53);
  });

  it('should verify double-entry journal balance correctly', () => {
    const balancedJournal = [
      { debitBDT: 1500.0, creditBDT: 0 },
      { debitBDT: 0, creditBDT: 1500.0 },
    ];
    expect(Money.isJournalBalanced(balancedJournal)).toBe(true);

    const unbalancedJournal = [
      { debitBDT: 1500.0, creditBDT: 0 },
      { debitBDT: 0, creditBDT: 1400.0 },
    ];
    expect(Money.isJournalBalanced(unbalancedJournal)).toBe(false);
  });
});
