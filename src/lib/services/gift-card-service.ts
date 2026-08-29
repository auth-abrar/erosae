import prisma from '../db';
import { Money } from '../money';

export class GiftCardService {
  /**
   * Issues a new Gift Card with initial balance and recipient details.
   */
  static async issueGiftCard(params: {
    initialValueBDT: number;
    senderId?: string | null;
    recipientEmail?: string | null;
    giftMessage?: string | null;
    expiresInDays?: number;
  }) {
    const { initialValueBDT, senderId, recipientEmail, giftMessage, expiresInDays = 365 } = params;

    if (!initialValueBDT || initialValueBDT <= 0) {
      throw new Error('Gift card initial balance must be greater than zero.');
    }

    const randomSegment1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomSegment2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const rawCode = `ERO-GIFT-${randomSegment1}-${randomSegment2}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const giftCard = await prisma.$transaction(async (tx) => {
      const card = await tx.giftCard.create({
        data: {
          codeEncrypted: rawCode,
          initialValue: Money.round(initialValueBDT),
          currentBalance: Money.round(initialValueBDT),
          senderId: senderId || null,
          recipientEmail: recipientEmail || null,
          giftMessage: giftMessage || null,
          expiresAt,
          isActive: true,
        },
      });

      // Log creation in ledger
      await tx.giftCardLedger.create({
        data: {
          giftCardId: card.id,
          amountDelta: Money.round(initialValueBDT),
        },
      });

      return card;
    });

    return { ...giftCard, code: rawCode };
  }

  /**
   * Checks the balance and validity of a Gift Card.
   */
  static async verifyGiftCard(code: string) {
    if (!code || typeof code !== 'string') {
      throw new Error('Gift card code is required.');
    }

    const card = await prisma.giftCard.findUnique({
      where: { codeEncrypted: code.trim().toUpperCase() },
      include: {
        ledger: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!card || !card.isActive) {
      return { isValid: false, message: 'Invalid or deactivated gift card code.' };
    }

    if (card.expiresAt && new Date() > card.expiresAt) {
      return { isValid: false, message: 'This gift card has expired.' };
    }

    if (card.currentBalance <= 0) {
      return { isValid: false, message: 'This gift card has zero remaining balance.' };
    }

    return {
      isValid: true,
      cardId: card.id,
      balanceBDT: card.currentBalance,
      initialValueBDT: card.initialValue,
      expiresAt: card.expiresAt,
    };
  }

  /**
   * Atomically redeems an amount from a Gift Card against an order.
   */
  static async redeemGiftCard(code: string, amountToRedeemBDT: number, orderId?: string) {
    const cleanCode = code.trim().toUpperCase();
    const amount = Money.round(amountToRedeemBDT);

    if (amount <= 0) {
      throw new Error('Redemption amount must be positive.');
    }

    return await prisma.$transaction(async (tx) => {
      const card = await tx.giftCard.findUnique({
        where: { codeEncrypted: cleanCode },
      });

      if (!card || !card.isActive) {
        throw new Error('Invalid or inactive gift card.');
      }

      if (card.currentBalance < amount) {
        throw new Error(`Insufficient gift card balance. Available: ৳${card.currentBalance}, Requested: ৳${amount}`);
      }

      const newBalance = Money.round(card.currentBalance - amount);

      const updatedCard = await tx.giftCard.update({
        where: { id: card.id },
        data: {
          currentBalance: newBalance,
        },
      });

      // Record transaction in ledger
      await tx.giftCardLedger.create({
        data: {
          giftCardId: card.id,
          amountDelta: -amount,
          orderId: orderId || null,
        },
      });

      return {
        success: true,
        redeemedAmountBDT: amount,
        remainingBalanceBDT: newBalance,
      };
    });
  }
}
