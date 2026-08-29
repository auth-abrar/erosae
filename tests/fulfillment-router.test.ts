import { describe, it, expect } from 'vitest';
import { FulfillmentService, FulfillmentItem } from '../src/lib/services/fulfillment-service';

describe('Hybrid Multi-Type Fulfillment Router', () => {
  it('should cleanly partition mixed order items into physical, digital, license, and dropship queues', () => {
    const mixedItems: FulfillmentItem[] = [
      { orderItemId: 'item-1', productId: 'prod-shirt', productType: 'PHYSICAL', quantity: 2 },
      { orderItemId: 'item-2', productId: 'prod-ebook', productType: 'DIGITAL', quantity: 1 },
      { orderItemId: 'item-3', productId: 'prod-windows-key', productType: 'LICENSE', quantity: 1 },
      { orderItemId: 'item-4', productId: 'prod-chatgpt', productType: 'SUBSCRIPTION_PRODUCT', quantity: 1 },
      { orderItemId: 'item-5', productId: 'prod-watch-cj', productType: 'DROPSHIPPING', quantity: 1 },
    ];

    const plan = FulfillmentService.categorizeOrderItems(mixedItems);

    expect(plan.physicalItems.length).toBe(1);
    expect(plan.physicalItems[0].productId).toBe('prod-shirt');

    expect(plan.digitalItems.length).toBe(1);
    expect(plan.digitalItems[0].productId).toBe('prod-ebook');

    expect(plan.licenseItems.length).toBe(1);
    expect(plan.licenseItems[0].productId).toBe('prod-windows-key');

    expect(plan.subscriptionItems.length).toBe(1);
    expect(plan.subscriptionItems[0].productId).toBe('prod-chatgpt');

    expect(plan.dropshipItems.length).toBe(1);
    expect(plan.dropshipItems[0].productId).toBe('prod-watch-cj');
  });
});
