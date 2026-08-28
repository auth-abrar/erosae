export interface GatewayConfig {
  id: string;
  name: string;
  slug: string;
  driver: 'STRIPE' | 'COD' | 'BANK_TRANSFER' | 'CUSTOM_STRUCTURED';
  isEnabled: boolean;
  isTestMode: boolean;
  supportedCurrencies: string[];
  supportedCountries: string[];
  credentials: Record<string, any>;
}

export interface PaymentInitiationParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currencyCode: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: any;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
  }>;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  status: 'PENDING' | 'SUCCESS' | 'REQUIRES_ACTION' | 'FAILED';
  gatewayTransactionId?: string;
  redirectUrl?: string;
  clientSecret?: string;
  instructions?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  gatewayTransactionId: string;
  amountPaid: number;
  currencyCode: string;
  rawResponse?: any;
  errorMessage?: string;
}

export interface PaymentGatewayDriver {
  initiatePayment(
    params: PaymentInitiationParams,
    config: GatewayConfig
  ): Promise<PaymentInitiationResult>;

  verifyPayment(
    payload: any,
    config: GatewayConfig
  ): Promise<PaymentVerificationResult>;

  handleWebhook?(
    rawBody: string,
    headers: Record<string, string>,
    config: GatewayConfig
  ): Promise<{ handled: boolean; orderNumber?: string; status?: string }>;
}