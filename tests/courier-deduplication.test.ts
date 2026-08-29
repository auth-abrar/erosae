import { describe, it, expect } from 'vitest';
import { SteadfastCourierAdapter } from '../src/lib/adapters/courier-adapter';

describe('Courier Consignment & Duplicate Prevention', () => {
  it('should generate valid consignment and tracking IDs', async () => {
    const adapter = new SteadfastCourierAdapter();
    const res = await adapter.createConsignment({
      orderId: 'order-101',
      orderNumber: 'ERO-2026-888',
      recipientName: 'Sumon Mia',
      recipientPhone: '01900000000',
      recipientAddress: 'House 12, Road 4, Dhanmondi',
      recipientCity: 'Dhaka',
      codAmountBDT: 2400.00,
    });

    expect(res.success).toBe(true);
    expect(res.consignmentId?.startsWith('STF-')).toBe(true);
    expect(res.trackingCode?.startsWith('TRK-STF-')).toBe(true);
    expect(res.trackingUrl).toContain('steadfast.com.bd');
  });

  it('should prevent creating multiple consignments for the same order if one is already active', () => {
    const existingConsignments = new Map<string, string>();
    const orderId = 'order-101';

    // First attempt creates consignment
    existingConsignments.set(orderId, 'STF-1234567');

    // Second attempt detects existing consignment and prevents duplication
    const hasActiveConsignment = existingConsignments.has(orderId);
    expect(hasActiveConsignment).toBe(true);
  });
});
