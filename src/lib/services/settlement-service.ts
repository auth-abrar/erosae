import prisma from '@/lib/db';

export interface SettlementStatementInput {
  courierCode: string;
  statementRef: string;
  totalSettledCod: number;
  courierFeesDeducted: number;
  settledDate?: Date;
  deliveredTrackingCodes: string[];
}

export class SettlementService {
  /**
   * Reconciles courier settlement statement against delivered orders.
   */
  public static async reconcileSettlement(input: SettlementStatementInput) {
    // Look up delivered shipments matching tracking numbers
    const shipments = await prisma.shipment.findMany({
      where: {
        courierCode: input.courierCode,
        trackingCode: { in: input.deliveredTrackingCodes },
      },
    });

    const totalExpectedCod = shipments.reduce((sum, s) => sum + (s.codAmountBDT || 0.0), 0.0);
    const expectedNetSettlement = totalExpectedCod - input.courierFeesDeducted;
    const discrepancyAmount = Math.round((input.totalSettledCod - expectedNetSettlement) * 100) / 100;

    const status = Math.abs(discrepancyAmount) < 0.01 ? 'MATCHED' : 'DISCREPANCY';
    const reconciliationNum = `REC-${Date.now().toString().slice(-6)}`;

    const reconciliation = await prisma.courierSettlementReconciliation.create({
      data: {
        reconciliationNum,
        courierCode: input.courierCode,
        statementRef: input.statementRef,
        totalExpectedCod,
        totalSettledCod: input.totalSettledCod,
        courierFeesDeducted: input.courierFeesDeducted,
        discrepancyAmount,
        status,
        settledDate: input.settledDate || new Date(),
        notes:
          status === 'MATCHED'
            ? 'All delivered parcel COD amounts matched courier settlement deposit perfectly.'
            : `Discrepancy of ৳${discrepancyAmount} detected between expected COD and deposited settlement.`,
      },
    });

    return reconciliation;
  }
}
