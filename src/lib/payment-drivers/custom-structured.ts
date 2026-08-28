import crypto from 'crypto';
import {
  PaymentGatewayDriver,
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentVerificationResult,
  GatewayConfig,
} from './types';

export class CustomStructuredGatewayDriver implements PaymentGatewayDriver {
  async initiatePayment(
    params: PaymentInitiationParams,
    config: GatewayConfig
  ): Promise<PaymentInitiationResult> {
    const creds = config.credentials || {};
    const endpointUrl = creds.initiateEndpointUrl;

    if (!endpointUrl) {
      return {
        success: false,
        status: 'FAILED',
        errorMessage: 'Custom gateway configuration missing initiateEndpointUrl',
      };
    }

    try {
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (creds.authType === 'BEARER' && creds.apiKey) {
        headers['Authorization'] = `Bearer ${creds.apiKey}`;
      } else if (creds.authType === 'HEADER_API_KEY' && creds.apiKeyHeaderName && creds.apiKey) {
        headers[creds.apiKeyHeaderName] = creds.apiKey;
      }

      // Prepare payload with structured variable replacement
      const payload: Record<string, any> = {
        order_id: params.orderId,
        order_number: params.orderNumber,
        amount: params.amount,
        currency: params.currencyCode,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone,
        return_url: params.successUrl,
        cancel_url: params.cancelUrl,
        items: params.items,
        ...(creds.extraPayloadFields || {}),
      };

      // Add HMAC signature if configured
      if (creds.authType === 'HMAC' && creds.hmacSecret) {
        const payloadString = JSON.stringify(payload);
        const signature = crypto
          .createHmac(creds.hmacAlgorithm || 'sha256', creds.hmacSecret)
          .update(payloadString)
          .digest('hex');
        headers[creds.hmacHeaderName || 'X-Signature'] = signature;
      }

      // If in sandbox mode without real endpoint connection
      if (config.isTestMode && (!endpointUrl.startsWith('http') || endpointUrl.includes('example.com'))) {
        return {
          success: true,
          status: 'PENDING',
          gatewayTransactionId: `cust_sim_${params.orderNumber}_${Date.now()}`,
          redirectUrl: `${params.successUrl}?gateway=${config.slug}&order_number=${params.orderNumber}`,
          metadata: { isSimulated: true, payloadSent: payload },
        };
      }

      const response = await fetch(endpointUrl, {
        method: creds.httpMethod || 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: 'FAILED',
          errorMessage: data.message || data.error || 'Custom payment gateway returned an error',
        };
      }

      // Extract transaction ID and redirect URL according to structured mapping fields
      const txnField = creds.responseTransactionIdField || 'transaction_id';
      const redirectField = creds.responseRedirectUrlField || 'redirect_url';

      return {
        success: true,
        status: 'PENDING',
        gatewayTransactionId: data[txnField] || `cust_${Date.now()}`,
        redirectUrl: data[redirectField] || params.successUrl,
        metadata: data,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        errorMessage: err.message || 'Error communicating with custom payment provider',
      };
    }
  }

  async verifyPayment(
    payload: any,
    config: GatewayConfig
  ): Promise<PaymentVerificationResult> {
    const creds = config.credentials || {};
    const verifyUrl = creds.verifyEndpointUrl;

    if (!verifyUrl) {
      return {
        success: true,
        status: 'SUCCESS',
        gatewayTransactionId: payload.transaction_id || `cust_${Date.now()}`,
        amountPaid: payload.amount || 0,
        currencyCode: payload.currency || 'USD',
        rawResponse: payload,
      };
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (creds.authType === 'BEARER' && creds.apiKey) {
        headers['Authorization'] = `Bearer ${creds.apiKey}`;
      } else if (creds.authType === 'HEADER_API_KEY' && creds.apiKeyHeaderName && creds.apiKey) {
        headers[creds.apiKeyHeaderName] = creds.apiKey;
      }

      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const statusField = creds.responseStatusField || 'status';
      const successValue = creds.responseSuccessValue || 'PAID';

      return {
        success: data[statusField] === successValue,
        status: data[statusField] === successValue ? 'SUCCESS' : 'PENDING',
        gatewayTransactionId: data.transaction_id || payload.transaction_id,
        amountPaid: data.amount || payload.amount || 0,
        currencyCode: data.currency || payload.currency || 'USD',
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        gatewayTransactionId: payload.transaction_id || '',
        amountPaid: 0,
        currencyCode: 'USD',
        errorMessage: err.message,
      };
    }
  }
}