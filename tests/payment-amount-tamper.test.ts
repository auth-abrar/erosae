import { describe, it, expect } from 'vitest';
import { Money } from '../src/lib/money';

describe('Payment Amount Integrity & Tamper Protection', () => {
  it('should detect when received amount is lower than authoritative order amount', () => {
    const orderTotalBDT = 3500.00;
    const tamperedCallbackAmountBDT = 35.00;

    const isMatch = Money.round(tamperedCallbackAmountBDT) >= Money.round(orderTotalBDT);
    expect(isMatch).toBe(false);
  });

  it('should accept valid exact payments', () => {
    const orderTotalBDT = 1250.50;
    const providerConfirmedAmount = 1250.50;

    const isMatch = Money.round(providerConfirmedAmount) >= Money.round(orderTotalBDT);
    expect(isMatch).toBe(true);
  });
});
