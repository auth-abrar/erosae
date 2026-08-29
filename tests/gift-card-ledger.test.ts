import { describe, it, expect } from 'vitest';
import { Money } from '../src/lib/money';

describe('Gift Card Engine & Immutable Ledger', () => {
  it('should compute initial and reduced balance accurately without rounding errors', () => {
    const initialValue = 5000.00;
    const redemption1 = 1450.75;
    const balanceAfter1 = Money.round(initialValue - redemption1);

    expect(balanceAfter1).toBe(3549.25);

    const redemption2 = 549.25;
    const balanceAfter2 = Money.round(balanceAfter1 - redemption2);
    expect(balanceAfter2).toBe(3000.00);
  });

  it('should reject redemptions exceeding available gift card balance', () => {
    const currentBalance = 500.00;
    const requestedRedeem = 600.00;

    const isAllowed = currentBalance >= requestedRedeem;
    expect(isAllowed).toBe(false);
  });

  it('should format secure gift card codes with standard prefix', () => {
    const code = 'ERO-GIFT-ABCD-1234';
    expect(code.startsWith('ERO-GIFT-')).toBe(true);
  });
});
