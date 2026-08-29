import { describe, it, expect } from 'vitest';
import { PaymentService } from '../src/lib/services/payment-service';

describe('Payment State Machine Transitions', () => {
  it('should allow valid payment lifecycle transitions', () => {
    expect(PaymentService.isValidTransition('INITIATED', 'PENDING')).toBe(true);
    expect(PaymentService.isValidTransition('PENDING', 'PAID')).toBe(true);
    expect(PaymentService.isValidTransition('PAID', 'PARTIALLY_REFUNDED')).toBe(true);
    expect(PaymentService.isValidTransition('PARTIALLY_REFUNDED', 'REFUNDED')).toBe(true);
  });

  it('should prevent illegal transitions from terminal states', () => {
    // Cannot transition from FAILED to PAID without creating a new payment record
    expect(PaymentService.isValidTransition('FAILED', 'PAID')).toBe(false);
    // Cannot transition from CANCELLED to PAID
    expect(PaymentService.isValidTransition('CANCELLED', 'PAID')).toBe(false);
    // Cannot transition from REFUNDED to PENDING
    expect(PaymentService.isValidTransition('REFUNDED', 'PENDING')).toBe(false);
  });

  it('should allow self-transitions (idempotent)', () => {
    expect(PaymentService.isValidTransition('PAID', 'PAID')).toBe(true);
    expect(PaymentService.isValidTransition('PENDING', 'PENDING')).toBe(true);
  });
});
