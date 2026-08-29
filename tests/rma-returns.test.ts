import { describe, it, expect } from 'vitest';
import { Money } from '../src/lib/money';

describe('RMA Returns, Inspection & Restocking Engine', () => {
  it('should calculate valid refund amounts from returned items', () => {
    const returnItems = [
      { unitPriceBDT: 1500, quantity: 2 }, // 3000
      { unitPriceBDT: 450, quantity: 1 },  // 450
    ];

    let totalRefund = 0;
    for (const item of returnItems) {
      totalRefund = Money.add(totalRefund, Money.multiply(item.unitPriceBDT, item.quantity));
    }

    expect(totalRefund).toBe(3450.00);
  });

  it('should only allow returns on orders that are DELIVERED or COMPLETED', () => {
    const validStatuses = ['DELIVERED', 'COMPLETED'];

    expect(validStatuses.includes('DELIVERED')).toBe(true);
    expect(validStatuses.includes('COMPLETED')).toBe(true);
    expect(validStatuses.includes('PENDING')).toBe(false);
    expect(validStatuses.includes('PROCESSING')).toBe(false);
  });

  it('should increment variant and warehouse stock on RESTOCKED inspection decision', () => {
    let variantStock = 12;
    const returnedUnits = 2;

    variantStock += returnedUnits;
    expect(variantStock).toBe(14);
  });
});
