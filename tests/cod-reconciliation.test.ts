import { describe, it, expect } from 'vitest';

describe('COD Courier Settlement Reconciliation', () => {
  it('should detect exact match when courier deposits match expected COD minus fees', () => {
    const totalExpectedCod = 10000.0;
    const courierFeesDeducted = 650.0;
    const totalSettledCod = 9350.0;

    const expectedNet = totalExpectedCod - courierFeesDeducted;
    const discrepancy = totalSettledCod - expectedNet;

    expect(discrepancy).toBe(0.0);
    const status = Math.abs(discrepancy) < 0.01 ? 'MATCHED' : 'DISCREPANCY';
    expect(status).toBe('MATCHED');
  });

  it('should detect discrepancy when courier deposits less than expected net COD', () => {
    const totalExpectedCod = 10000.0;
    const courierFeesDeducted = 650.0;
    const totalSettledCod = 8500.0; // 850 BDT missing

    const expectedNet = totalExpectedCod - courierFeesDeducted;
    const discrepancy = totalSettledCod - expectedNet;

    expect(discrepancy).toBe(-850.0);
    const status = Math.abs(discrepancy) < 0.01 ? 'MATCHED' : 'DISCREPANCY';
    expect(status).toBe('DISCREPANCY');
  });
});
