import { describe, it, expect } from 'vitest';
import { Money } from '../src/lib/money';
import { FulfillmentService, FulfillmentItem } from '../src/lib/services/fulfillment-service';

describe('Payment to Post-Payment Fulfillment Lifecycle', () => {
  it('should verify double-entry journal balance for received payments (Total Debits == Total Credits)', () => {
    const paymentAmount = 4500.00;

    const journalLines = [
      { accountCode: '1010', accountName: 'bKash Settlement', debitAmountBDT: paymentAmount, creditAmountBDT: 0.0 },
      { accountCode: '1100', accountName: 'Accounts Receivable', debitAmountBDT: 0.0, creditAmountBDT: paymentAmount },
    ];

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of journalLines) {
      totalDebit = Money.add(totalDebit, line.debitAmountBDT);
      totalCredit = Money.add(totalCredit, line.creditAmountBDT);
    }

    expect(totalDebit).toBe(totalCredit);
    expect(totalDebit).toBe(4500.00);
  });

  it('should immediately route paid order items into appropriate fulfillment pipelines', () => {
    const orderItems: FulfillmentItem[] = [
      { orderItemId: 'item-phys', productId: 'prod-dress', productType: 'PHYSICAL', quantity: 1 },
      { orderItemId: 'item-lic', productId: 'prod-antivirus', productType: 'LICENSE', quantity: 2 },
    ];

    const plan = FulfillmentService.categorizeOrderItems(orderItems);
    expect(plan.physicalItems.length).toBe(1);
    expect(plan.licenseItems.length).toBe(1);
    expect(plan.licenseItems[0].quantity).toBe(2);
  });
});
