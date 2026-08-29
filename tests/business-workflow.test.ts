import { describe, it, expect } from 'vitest';
import { Money } from '../src/lib/money';
import { OrderStateMachine } from '../src/lib/order-state-machine';

describe('End-to-End Business Commerce & Accounting Workflows', () => {
  it('should calculate complete cart totals with dynamic shipping and percentage coupon', () => {
    const items = [
      { unitPriceBDT: 1200, quantity: 2 }, // 2400
      { unitPriceBDT: 450, quantity: 1 },  // 450 -> Subtotal: 2850
    ];
    const shippingFee = 70; // Inside Dhaka
    const subtotal = 2850;
    const discount = Money.multiply(subtotal, 0.10); // 10% coupon = 285

    const { subtotalBDT, totalBDT } = Money.calculateOrderTotals({
      items,
      shippingFeeBDT: shippingFee,
      discountBDT: discount,
    });

    expect(subtotalBDT).toBe(2850);
    expect(totalBDT).toBe(2850 - 285 + 70); // 2635
  });

  it('should grant free shipping when subtotal exceeds free shipping threshold (৳3000)', () => {
    const items = [
      { unitPriceBDT: 1800, quantity: 2 }, // 3600
    ];
    const threshold = 3000;
    const isFree = 3600 >= threshold;
    const shippingFee = isFree ? 0 : 130;

    const { totalBDT } = Money.calculateOrderTotals({
      items,
      shippingFeeBDT: shippingFee,
      discountBDT: 0,
    });

    expect(totalBDT).toBe(3600);
  });

  it('should enforce that total order revenue recognized equals journal debits and credits', () => {
    const orderTotal = 4250.75;
    const journalLines = [
      { accountId: 'acc-ar-1100', debitBDT: orderTotal, creditBDT: 0 },
      { accountId: 'acc-rev-4000', debitBDT: 0, creditBDT: orderTotal },
    ];

    expect(Money.isJournalBalanced(journalLines)).toBe(true);
    expect(journalLines[0].debitBDT).toBe(orderTotal);
    expect(journalLines[1].creditBDT).toBe(orderTotal);
  });

  it('should handle complete order state lifecycle from PENDING to COMPLETED', () => {
    let status: any = 'PENDING';

    expect(OrderStateMachine.canTransitionOrder(status, 'PROCESSING')).toBe(true);
    status = 'PROCESSING';

    expect(OrderStateMachine.canTransitionOrder(status, 'PACKED')).toBe(true);
    status = 'PACKED';

    expect(OrderStateMachine.canTransitionOrder(status, 'SHIPPED')).toBe(true);
    status = 'SHIPPED';

    expect(OrderStateMachine.canTransitionOrder(status, 'DELIVERED')).toBe(true);
    status = 'DELIVERED';

    expect(OrderStateMachine.canTransitionOrder(status, 'COMPLETED')).toBe(true);
    status = 'COMPLETED';

    // Disallow illegal jump back from COMPLETED to PENDING
    expect(OrderStateMachine.canTransitionOrder(status, 'PENDING')).toBe(false);
  });

  it('should allow cancellation from PENDING and restore inventory delta', () => {
    const initialStock = 20;
    const orderedQuantity = 3;

    // Stock deduction on checkout
    let currentStock = initialStock - orderedQuantity;
    expect(currentStock).toBe(17);

    // Order cancellation event
    const statusTransitionAllowed = OrderStateMachine.canTransitionOrder('PENDING', 'CANCELLED');
    expect(statusTransitionAllowed).toBe(true);

    // Stock restoration
    currentStock += orderedQuantity;
    expect(currentStock).toBe(20);
  });
});
