import { describe, it, expect } from 'vitest';
import { OrderStateMachine } from '../src/lib/order-state-machine';

describe('Order & Payment State Machine Enforcement', () => {
  it('should allow valid sequential order progression', () => {
    expect(OrderStateMachine.canTransitionOrder('PENDING', 'PROCESSING')).toBe(true);
    expect(OrderStateMachine.canTransitionOrder('PROCESSING', 'PACKED')).toBe(true);
    expect(OrderStateMachine.canTransitionOrder('PACKED', 'SHIPPED')).toBe(true);
    expect(OrderStateMachine.canTransitionOrder('SHIPPED', 'DELIVERED')).toBe(true);
    expect(OrderStateMachine.canTransitionOrder('DELIVERED', 'COMPLETED')).toBe(true);
  });

  it('should block illegal status jumps or unauthorized backward transitions', () => {
    // Cannot jump directly from PENDING to DELIVERED
    expect(OrderStateMachine.canTransitionOrder('PENDING', 'DELIVERED')).toBe(false);
    // Cannot revert from DELIVERED back to PENDING
    expect(OrderStateMachine.canTransitionOrder('DELIVERED', 'PENDING')).toBe(false);
    // Cannot reopen CANCELLED order
    expect(OrderStateMachine.canTransitionOrder('CANCELLED', 'PROCESSING')).toBe(false);
  });

  it('should throw an explicit assertion error on invalid transitions', () => {
    expect(() => {
      OrderStateMachine.assertOrderTransition('PENDING', 'COMPLETED');
    }).toThrowError(/Invalid order status transition/);
  });

  it('should validate payment status transitions correctly', () => {
    expect(OrderStateMachine.canTransitionPayment('PENDING', 'PAID')).toBe(true);
    expect(OrderStateMachine.canTransitionPayment('PAID', 'REFUNDED')).toBe(true);
    expect(OrderStateMachine.canTransitionPayment('REFUNDED', 'PENDING')).toBe(false);
  });
});
