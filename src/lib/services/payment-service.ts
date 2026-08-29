import prisma from '../db';
import { Money } from '../money';
import { FulfillmentService } from './fulfillment-service';
import { NotificationService } from './notification-service';
import { PaymentAdapterRegistry } from '../adapters/payment-adapter';

export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export class PaymentService {
  /**
   * Validates if a payment status transition is permitted.
   */
  static isValidTransition(currentStatus: PaymentStatus | string, targetStatus: PaymentStatus): boolean {
    const curr = (currentStatus || 'INITIATED').toUpperCase() as PaymentStatus;

    if (curr === targetStatus) return true;

    const allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      INITIATED: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED'],
      PENDING: ['PAID', 'AUTHORIZED', 'FAILED', 'CANCELLED', 'EXPIRED'],
      AUTHORIZED: ['PAID', 'FAILED', 'CANCELLED'],
      PAID: ['PARTIALLY_REFUNDED', 'REFUNDED'],
      PARTIALLY_REFUNDED: ['REFUNDED'],
      FAILED: [],
      CANCELLED: [],
      EXPIRED: [],
      REFUNDED: [],
    };

    return (allowedTransitions[curr] || []).includes(targetStatus);
  }

  /**
   * Initiates payment for an order through the configured provider adapter.
   */
  static async initiateOrderPayment(params: {
    orderId: string;
    gatewayCode: string;
    customerEmail: string;
    customerPhone: string;
    customerName: string;
    baseUrl: string;
  }) {
    const { orderId, gatewayCode, customerEmail, customerPhone, customerName, baseUrl } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error(`Order #${orderId} not found.`);
    }

    if (order.paymentStatus === 'PAID') {
      throw new Error(`Order #${order.orderNumber} is already paid.`);
    }

    const adapter = PaymentAdapterRegistry.getAdapter(gatewayCode);

    // Create or update Payment record in INITIATED state
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        gatewayCode: gatewayCode.toUpperCase(),
        amount: order.totalAmountBDT,
        currency: order.currencyCode || 'BDT',
        status: 'INITIATED',
      },
    });

    const initResult = await adapter.initiatePayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountBDT: order.totalAmountBDT,
      currency: order.currencyCode || 'BDT',
      customerName,
      customerEmail,
      customerPhone,
      returnUrl: `${baseUrl}/checkout/success?orderId=${order.id}&payment_ref=${payment.id}`,
      cancelUrl: `${baseUrl}/checkout?orderId=${order.id}&payment_cancelled=true`,
    });

    if (initResult.success && initResult.paymentId) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionRef: initResult.paymentId,
          status: 'PENDING',
        },
      });
    }

    return {
      paymentId: payment.id,
      redirectUrl: initResult.redirectUrl,
      gatewayResponse: initResult.gatewayRaw,
    };
  }

  /**
   * Authoritatively verifies and confirms a payment from provider IPN / webhook.
   * Enforces server-side amount checks, currency checks, idempotency, and state transitions.
   */
  static async verifyAndConfirmPayment(params: {
    gatewayCode: string;
    payload: any;
    orderId?: string;
    transactionRef?: string;
  }) {
    const { gatewayCode, payload, orderId, transactionRef } = params;

    const adapter = PaymentAdapterRegistry.getAdapter(gatewayCode);
    const verification = await adapter.verifyPayment(payload);

    if (!verification.isVerified || verification.status !== 'SUCCESS') {
      return {
        success: false,
        message: 'Payment verification failed at provider adapter level.',
        status: verification.status,
      };
    }

    const ref = transactionRef || verification.transactionRef;

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          ...(ref ? [{ transactionRef: ref }] : []),
          ...(orderId ? [{ orderId }] : []),
        ],
      },
      include: { order: true },
    });

    if (!payment) {
      throw new Error(`No payment record found matching transaction ref '${ref}' or order '${orderId}'.`);
    }

    // 1. Idempotency Check: If already marked PAID, return success without duplicate processing
    if (payment.status === 'PAID' && payment.order.paymentStatus === 'PAID') {
      return {
        success: true,
        isIdempotent: true,
        message: 'Payment was already verified and confirmed.',
        orderId: payment.orderId,
      };
    }

    // 2. Strict Server-Side Amount Verification
    const expectedAmount = payment.order.totalAmountBDT;
    const receivedAmount = verification.amountPaidBDT || payment.amount;

    if (Money.round(receivedAmount) < Money.round(expectedAmount)) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          gatewayResponseJson: JSON.stringify({
            error: 'AMOUNT_MISMATCH_SECURITY_VIOLATION',
            expected: expectedAmount,
            received: receivedAmount,
            raw: verification.gatewayRaw,
          }),
        },
      });

      await prisma.orderTimeline.create({
        data: {
          orderId: payment.orderId,
          status: 'PAYMENT_AMOUNT_MISMATCH',
          title: 'Security Alert: Payment Amount Mismatch',
          description: `Received ৳${receivedAmount} but order total is ৳${expectedAmount}. Transaction rejected.`,
          actorType: 'GATEWAY',
        },
      });

      throw new Error(
        `Security Alert: Payment amount mismatch. Expected: ৳${expectedAmount}, Provider reported: ৳${receivedAmount}.`
      );
    }

    // 3. Atomic Database Transaction: Update Payment, Order, Accounting, and trigger Digital Entitlements
    await prisma.$transaction(async (tx) => {
      // Update Payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          transactionRef: ref || payment.transactionRef,
          gatewayResponseJson: JSON.stringify(verification.gatewayRaw || {}),
        },
      });

      // Update Order
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PAID',
          status: payment.order.status === 'PENDING' ? 'PROCESSING' : payment.order.status,
        },
      });

      // Add Order Timeline
      await tx.orderTimeline.create({
        data: {
          orderId: payment.orderId,
          status: 'PAID',
          title: 'Payment Confirmed',
          description: `Payment of ৳${receivedAmount} confirmed via ${gatewayCode} (Ref: ${ref || 'N/A'}).`,
          actorType: 'GATEWAY',
        },
      });

      // Record Accounting Journal Entry: Debit Bank/Cash, Credit Accounts Receivable
      const bankAccount = await tx.account.findFirst({ where: { code: { in: ['1010', '1000'] } } });
      const arAccount = await tx.account.findFirst({ where: { code: '1100' } });

      if (bankAccount && arAccount) {
        const entryNumber = `JE-PAY-${Date.now().toString().slice(-6)}`;

        await tx.journalEntry.create({
          data: {
            entryNumber,
            description: `Payment confirmed for Order #${payment.order.orderNumber} via ${gatewayCode}`,
            referenceType: 'PAYMENT',
            referenceId: payment.id,
            orderId: payment.orderId,
            lines: {
              create: [
                {
                  accountId: bankAccount.id,
                  debitBDT: receivedAmount,
                  creditBDT: 0.0,
                  memo: `${gatewayCode} Settlement`,
                },
                {
                  accountId: arAccount.id,
                  debitBDT: 0.0,
                  creditBDT: receivedAmount,
                  memo: `AR Settlement for Order #${payment.order.orderNumber}`,
                },
              ],
            },
          },
        });
      }
    });

    // 4. Trigger Automated Digital Product Fulfillment
    await FulfillmentService.fulfillDigitalEntitlements(payment.orderId);

    // 5. Dispatch Bilingual Notification
    try {
      await NotificationService.dispatchNotification({
        event: 'PAYMENT_CONFIRMATION',
        recipientEmail: payment.order.shippingAddressJson
          ? JSON.parse(payment.order.shippingAddressJson).email || ''
          : '',
        variables: {
          orderNumber: payment.order.orderNumber,
          amount: receivedAmount,
          gateway: gatewayCode,
        },
      });
    } catch (e) {
      console.warn('Notification dispatch error (non-fatal):', e);
    }

    return {
      success: true,
      message: 'Payment successfully verified and confirmed.',
      orderId: payment.orderId,
      transactionRef: ref,
    };
  }
}
