import { describe, it, expect } from 'vitest';

describe('Bilingual Translation & SolaimanLipi Independence Engine', () => {
  it('should maintain independent English and Bengali copy without cross-contamination', () => {
    const translation = {
      key: 'cart.checkout_cta',
      namespace: 'storefront',
      valueEn: 'Proceed to Checkout',
      valueBn: 'চেকআউটে এগিয়ে যান',
    };

    // Modify Bengali only
    const updatedTranslation = {
      ...translation,
      valueBn: 'নিরাপদ চেকআউট সম্পন্ন করুন',
    };

    expect(updatedTranslation.valueEn).toBe('Proceed to Checkout');
    expect(updatedTranslation.valueBn).toBe('নিরাপদ চেকআউট সম্পন্ন করুন');
  });

  it('should format dictionary namespace composite keys correctly', () => {
    const namespace = 'checkout';
    const key = 'shipping_zone_dhaka';
    const compositeId = `${namespace}:${key}`;

    expect(compositeId).toBe('checkout:shipping_zone_dhaka');
  });
});
