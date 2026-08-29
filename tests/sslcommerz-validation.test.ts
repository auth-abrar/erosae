import { describe, it, expect } from 'vitest';
import { SSLCommerzPaymentAdapter } from '../src/lib/adapters/payment-adapter';

describe('SSLCommerz Adapter & Server-Side IPN Validation', () => {
  it('should initialize transaction with order number and amount parameters', async () => {
    const adapter = new SSLCommerzPaymentAdapter();
    const res = await adapter.initiatePayment({
      orderId: 'order-123',
      orderNumber: 'ERO-2026-999',
      amountBDT: 1850.00,
      currency: 'BDT',
      customerName: 'Rahim Ahmed',
      customerEmail: 'rahim@example.com',
      customerPhone: '01700000000',
      returnUrl: 'http://localhost:3000/checkout/success',
      cancelUrl: 'http://localhost:3000/checkout',
    });

    expect(res.success).toBe(true);
    expect(res.paymentId?.startsWith('ERO-SSL-')).toBe(true);
    expect(res.redirectUrl).toBeDefined();
  });

  it('should verify IPN payload with VALID status and return success with serverValidated flag', async () => {
    const adapter = new SSLCommerzPaymentAdapter();
    const payload = {
      val_id: 'VAL-99887766',
      status: 'VALID',
      tran_id: 'ERO-SSL-2026-001',
      amount: '1850.00',
      currency: 'BDT',
    };

    const verification = await adapter.verifyPayment(payload);
    expect(verification.isVerified).toBe(true);
    expect(verification.status).toBe('SUCCESS');
    expect(verification.amountPaidBDT).toBe(1850.00);
    expect(verification.gatewayRaw.serverValidated).toBe(true);
  });

  it('should reject IPN payload with FAILED status', async () => {
    const adapter = new SSLCommerzPaymentAdapter();
    const payload = {
      status: 'FAILED',
      tran_id: 'ERO-SSL-2026-002',
    };

    const verification = await adapter.verifyPayment(payload);
    expect(verification.isVerified).toBe(false);
    expect(verification.status).toBe('FAILED');
  });
});
