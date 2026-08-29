/**
 * Standardized Supplier & Dropshipping Integration Adapter Interface
 */

export interface SupplierProductSyncResult {
  supplierSku: string;
  costUSD: number;
  availableStock: number;
  isAvailable: boolean;
}

export interface SupplierOrderForwardRequest {
  orderNumber: string;
  supplierSku: string;
  quantity: number;
  recipientName: string;
  recipientAddress: string;
  recipientCountry: string;
}

export interface SupplierOrderForwardResponse {
  success: boolean;
  supplierOrderId?: string;
  estimatedDeliveryDays?: number;
  supplierRaw?: any;
}

export interface ISupplierAdapter {
  supplierCode: string;
  syncProductData(supplierSku: string): Promise<SupplierProductSyncResult>;
  forwardOrder(req: SupplierOrderForwardRequest): Promise<SupplierOrderForwardResponse>;
}

export class CJDropshippingAdapter implements ISupplierAdapter {
  supplierCode = 'CJ_DROP';

  async syncProductData(supplierSku: string): Promise<SupplierProductSyncResult> {
    return {
      supplierSku,
      costUSD: 14.50,
      availableStock: 250,
      isAvailable: true,
    };
  }

  async forwardOrder(req: SupplierOrderForwardRequest): Promise<SupplierOrderForwardResponse> {
    return {
      success: true,
      supplierOrderId: `CJ-ORD-${Date.now().toString().slice(-8)}`,
      estimatedDeliveryDays: 10,
      supplierRaw: { mode: 'SANDBOX_FORWARDING', sku: req.supplierSku },
    };
  }
}

export class AliExpressAdapter implements ISupplierAdapter {
  supplierCode = 'ALI_EXPRESS';

  async syncProductData(supplierSku: string): Promise<SupplierProductSyncResult> {
    return {
      supplierSku,
      costUSD: 18.20,
      availableStock: 120,
      isAvailable: true,
    };
  }

  async forwardOrder(req: SupplierOrderForwardRequest): Promise<SupplierOrderForwardResponse> {
    return {
      success: true,
      supplierOrderId: `ALI-ORD-${Date.now().toString().slice(-8)}`,
      estimatedDeliveryDays: 14,
      supplierRaw: { mode: 'SANDBOX_FORWARDING', sku: req.supplierSku },
    };
  }
}
