import prisma from '../db';
import { Money } from '../money';

export interface TaxCalculationResult {
  taxableAmountBDT: number;
  taxAmountBDT: number;
  totalWithTaxBDT: number;
  effectiveRatePercent: number;
  isInclusive: boolean;
}

export class TaxService {
  /**
   * Calculates tax for a given amount based on tax class configuration.
   */
  static calculateTax(params: {
    amountBDT: number;
    ratePercent: number;
    isInclusive?: boolean;
  }): TaxCalculationResult {
    const { amountBDT, ratePercent, isInclusive = false } = params;

    if (ratePercent <= 0 || amountBDT <= 0) {
      return {
        taxableAmountBDT: Money.round(amountBDT),
        taxAmountBDT: 0.0,
        totalWithTaxBDT: Money.round(amountBDT),
        effectiveRatePercent: 0.0,
        isInclusive,
      };
    }

    if (isInclusive) {
      // Price includes tax: Tax = Amount - (Amount / (1 + Rate))
      const divisor = 1 + ratePercent / 100;
      const baseAmount = Money.round(amountBDT / divisor);
      const taxAmount = Money.round(amountBDT - baseAmount);

      return {
        taxableAmountBDT: baseAmount,
        taxAmountBDT: taxAmount,
        totalWithTaxBDT: Money.round(amountBDT),
        effectiveRatePercent: ratePercent,
        isInclusive: true,
      };
    } else {
      // Price excludes tax: Tax = Amount * Rate
      const taxAmount = Money.round(Money.multiply(amountBDT, ratePercent / 100));
      const total = Money.add(amountBDT, taxAmount);

      return {
        taxableAmountBDT: Money.round(amountBDT),
        taxAmountBDT: taxAmount,
        totalWithTaxBDT: total,
        effectiveRatePercent: ratePercent,
        isInclusive: false,
      };
    }
  }

  /**
   * Retrieves active tax rate by class code.
   */
  static async getTaxClass(code: string) {
    return await prisma.taxClass.findUnique({
      where: { code: code.toUpperCase() },
    });
  }
}
