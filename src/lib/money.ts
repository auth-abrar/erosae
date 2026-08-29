/**
 * Deterministic Financial Calculations & Precision Helper for Erosae.com
 *
 * Base Currency: BDT (৳)
 * Financial Rule: All monetary arithmetic operates with exact 2-decimal point precision
 * to prevent floating-point rounding anomalies (IEEE 754 drift).
 */

export interface LineItemPricing {
  unitPriceBDT: number;
  quantity: number;
  discountBDT?: number;
  taxRatePercent?: number;
}

export class Money {
  /**
   * Deterministically rounds a monetary number to 2 decimal places.
   */
  static round(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  /**
   * Safe addition of multiple monetary amounts.
   */
  static add(...amounts: number[]): number {
    const total = amounts.reduce((acc, curr) => acc + (curr || 0), 0);
    return Money.round(total);
  }

  /**
   * Safe subtraction: a - b.
   */
  static subtract(a: number, b: number): number {
    return Money.round((a || 0) - (b || 0));
  }

  /**
   * Safe multiplication: amount * multiplier.
   */
  static multiply(amount: number, multiplier: number): number {
    return Money.round((amount || 0) * (multiplier || 0));
  }

  /**
   * Calculate line item subtotal.
   */
  static calculateLineTotal(unitPriceBDT: number, quantity: number, discountBDT = 0): number {
    const gross = Money.multiply(unitPriceBDT, quantity);
    return Math.max(0, Money.subtract(gross, discountBDT));
  }

  /**
   * Calculates order summary totals deterministically.
   */
  static calculateOrderTotals(params: {
    items: { unitPriceBDT: number; quantity: number }[];
    shippingFeeBDT: number;
    discountBDT: number;
    taxRatePercent?: number;
  }): {
    subtotalBDT: number;
    shippingBDT: number;
    discountBDT: number;
    taxBDT: number;
    totalBDT: number;
  } {
    const subtotalBDT = params.items.reduce(
      (sum, item) => Money.add(sum, Money.multiply(item.unitPriceBDT, item.quantity)),
      0
    );

    const discountBDT = Money.round(Math.min(subtotalBDT, Math.max(0, params.discountBDT || 0)));
    const taxableAmount = Math.max(0, Money.subtract(subtotalBDT, discountBDT));
    
    const taxRate = params.taxRatePercent || 0;
    const taxBDT = taxRate > 0 ? Money.multiply(taxableAmount, taxRate / 100) : 0;
    const shippingBDT = Money.round(Math.max(0, params.shippingFeeBDT || 0));

    const totalBDT = Money.add(taxableAmount, shippingBDT, taxBDT);

    return {
      subtotalBDT,
      shippingBDT,
      discountBDT,
      taxBDT,
      totalBDT,
    };
  }

  /**
   * Verify double-entry journal balance: Total Debits == Total Credits.
   */
  static isJournalBalanced(lines: { debitBDT: number; creditBDT: number }[]): boolean {
    const totalDebits = lines.reduce((sum, line) => Money.add(sum, line.debitBDT || 0), 0);
    const totalCredits = lines.reduce((sum, line) => Money.add(sum, line.creditBDT || 0), 0);
    return Math.abs(totalDebits - totalCredits) < 0.001;
  }
}
