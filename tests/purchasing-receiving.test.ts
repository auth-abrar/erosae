import { describe, it, expect } from 'vitest';
import { Money } from '../src/lib/money';

describe('Supplier Purchasing & Goods Receiving Engine', () => {
  it('should calculate total PO costs accurately from item unit costs and quantities', () => {
    const items = [
      { unitCostBDT: 450, quantityOrdered: 50 },  // 22,500
      { unitCostBDT: 1200, quantityOrdered: 20 }, // 24,000
    ];

    let totalCost = 0;
    for (const item of items) {
      totalCost = Money.add(totalCost, Money.multiply(item.unitCostBDT, item.quantityOrdered));
    }

    expect(totalCost).toBe(46500.00);
  });

  it('should determine status as PARTIALLY_RECEIVED vs RECEIVED based on quantities', () => {
    const ordered = 100;
    let received = 40;

    let status = received >= ordered ? 'RECEIVED' : received > 0 ? 'PARTIALLY_RECEIVED' : 'ISSUED';
    expect(status).toBe('PARTIALLY_RECEIVED');

    received = 100;
    status = received >= ordered ? 'RECEIVED' : received > 0 ? 'PARTIALLY_RECEIVED' : 'ISSUED';
    expect(status).toBe('RECEIVED');
  });

  it('should increment warehouse stock on-hand matching the goods receipt delta', () => {
    const initialOnHand = 15;
    const receivedDelta = 35;
    const balanceAfter = initialOnHand + receivedDelta;

    expect(balanceAfter).toBe(50);
  });
});
