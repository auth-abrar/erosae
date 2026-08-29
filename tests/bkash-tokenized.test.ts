import { describe, it, expect } from 'vitest';
import { BkashPaymentAdapter } from '../src/lib/adapters/payment-adapter';

describe('bKash Tokenized Checkout Adapter', () => {
  it('should generate bKash payment ID and redirect URL', async () => {
    const adapter = new BkashPaymentAdapter();
    const res = await adapter.initiatePayment({
      orderId: 'order-bkash-1',
      orderNumber: 'ERO-BK-101',
      amountBDT: 750.00,
      currency: 'BDT',
      customerName: 'Karim Uddin',
      customerEmail: 'karim@example.com',
      customerPhone: '01800000000',
      returnUrl: 'http://localhost:3000/checkout/success',
      cancelUrl: 'http://localhost:3000/checkout',
    });

    expect(res.success).toBe(true);
    expect(res.paymentId?.startsWith('BK-')).toBe(true);
    expect(res.redirectUrl).toBeDefined();
  });

  it('should verify payment execution callback with COMPLETED transaction status', async () => {
    const adapter = new BkashPaymentAdapter();
    const callbackPayload = {
      paymentID: 'BK-12345678',
      trxID: 'TRX998877',
      transactionStatus: 'Completed',
      amount: '750.00',
      currency: 'BDT',
    };

    const verification = await adapter.verifyPayment(callbackPayload);
    expect(verification.isVerified).toBe(true);
    expect(verification.status).toBe('SUCCESS');
    expect(verification.transactionRef).toBe('TRX998877');
    expect(verification.amountPaidBDT).toBe(750.00);
  });
});
