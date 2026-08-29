/**
 * Authoritative Order & Payment State Machine for Erosae.com
 *
 * Enforces valid state transitions and blocks unauthorized or illegal status overrides.
 */

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'RETURNED'
  | 'FAILED';

export type PaymentStatus =
  | 'PENDING'
  | 'INITIATED'
  | 'AUTHORIZED'
  | 'PAID'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'FAILED';

export type FulfillmentStatus =
  | 'UNFULFILLED'
  | 'PARTIAL'
  | 'FULFILLED'
  | 'RETURNED';

// Allowed state transitions for Order Status
const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED', 'FAILED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['COMPLETED', 'REFUNDED'],
  COMPLETED: ['REFUNDED'],
  RETURNED: ['REFUNDED'],
  CANCELLED: [], // Terminal
  REFUNDED: [],  // Terminal
  FAILED: ['PENDING', 'CANCELLED'],
};

// Allowed state transitions for Payment Status
const ALLOWED_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ['INITIATED', 'PAID', 'FAILED', 'REFUNDED'],
  INITIATED: ['AUTHORIZED', 'PAID', 'FAILED'],
  AUTHORIZED: ['PAID', 'FAILED'],
  PAID: ['PARTIALLY_REFUNDED', 'REFUNDED'],
  PARTIALLY_REFUNDED: ['REFUNDED'],
  REFUNDED: [], // Terminal
  FAILED: ['INITIATED', 'PENDING'],
};

export class OrderStateMachine {
  /**
   * Validates whether an order status transition is permissible.
   */
  static canTransitionOrder(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    if (currentStatus === newStatus) return true;
    const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(newStatus) : false;
  }

  /**
   * Validates whether a payment status transition is permissible.
   */
  static canTransitionPayment(currentStatus: PaymentStatus, newStatus: PaymentStatus): boolean {
    if (currentStatus === newStatus) return true;
    const allowed = ALLOWED_PAYMENT_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(newStatus) : false;
  }

  /**
   * Asserts order transition validity or throws a descriptive error.
   */
  static assertOrderTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    if (!OrderStateMachine.canTransitionOrder(currentStatus, newStatus)) {
      throw new Error(
        `Invalid order status transition: Cannot change status from '${currentStatus}' to '${newStatus}'.`
      );
    }
  }

  /**
   * Asserts payment transition validity or throws a descriptive error.
   */
  static assertPaymentTransition(currentStatus: PaymentStatus, newStatus: PaymentStatus): void {
    if (!OrderStateMachine.canTransitionPayment(currentStatus, newStatus)) {
      throw new Error(
        `Invalid payment status transition: Cannot change payment status from '${currentStatus}' to '${newStatus}'.`
      );
    }
  }
}
