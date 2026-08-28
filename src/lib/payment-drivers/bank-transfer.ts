import {
  PaymentGatewayDriver,
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentVerificationResult,
  GatewayConfig,
} from './types';

export class BankTransferDriver implements PaymentGatewayDriver {
  async initiatePayment(
    params: PaymentInitiationParams,
    config: GatewayConfig
  ): Promise<PaymentInitiationResult> {
    const creds = config.credentials || {};
    const instructions = `
Bank: ${creds.bankName || 'HSBC / Emirates NBD'}
Account Name: ${creds.accountName || 'Erosae Commercial LLC'}
Account Number: ${creds.accountNumber || '102938475601'}
IBAN: ${creds.iban || 'AE07026000102938475601'}
Swift: ${creds.swift || 'EBILAEADXXX'}
Reference: ${params.orderNumber}

${creds.instructions || 'Please include your Order Number in the transfer memo. Your order will be fulfilled as soon as the funds clear.'}
`.trim();

    return {
      success: true,
      status: 'PENDING',
      gatewayTransactionId: `BANK_${params.orderNumber}`,
      instructions,
      redirectUrl: `${params.successUrl}?gateway=bank-transfer&order_number=${params.orderNumber}`,
    };
  }

  async verifyPayment(
    payload: any,
    config: GatewayConfig
  ): Promise<PaymentVerificationResult> {
    return {
      success: true,
      status: 'PENDING',
      gatewayTransactionId: `BANK_${payload.orderNumber || Date.now()}`,
      amountPaid: payload.amount || 0,
      currencyCode: payload.currency || 'USD',
      rawResponse: { method: 'BANK_TRANSFER' },
    };
  }
}