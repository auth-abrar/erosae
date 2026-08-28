import {
  PaymentGatewayDriver,
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentVerificationResult,
  GatewayConfig,
} from './types';

export class CashOnDeliveryDriver implements PaymentGatewayDriver {
  async initiatePayment(
    params: PaymentInitiationParams,
    config: GatewayConfig
  ): Promise<PaymentInitiationResult> {
    const instructions =
      config.credentials?.instructions ||
      'Pay in cash or card to the courier delivery agent upon receiving your order.';

    return {
      success: true,
      status: 'PENDING',
      gatewayTransactionId: `COD_${params.orderNumber}`,
      instructions,
      redirectUrl: `${params.successUrl}?gateway=cod&order_number=${params.orderNumber}`,
    };
  }

  async verifyPayment(
    payload: any,
    config: GatewayConfig
  ): Promise<PaymentVerificationResult> {
    return {
      success: true,
      status: 'PENDING', // COD remains pending payment until courier marks as collected
      gatewayTransactionId: `COD_${payload.orderNumber || Date.now()}`,
      amountPaid: payload.amount || 0,
      currencyCode: payload.currency || 'USD',
      rawResponse: { method: 'CASH_ON_DELIVERY', verified: true },
    };
  }
}