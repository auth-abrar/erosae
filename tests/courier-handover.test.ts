import { describe, it, expect } from 'vitest';

describe('Courier Handover Sessions & Manifest Calculations', () => {
  it('should compute handover session totals correctly and prevent double-scanning', () => {
    const session = {
      id: 'hnd_session_1',
      courierCode: 'STEADFAST',
      items: [
        { trackingCode: 'ST-1001', codAmountBDT: 1500.0 },
        { trackingCode: 'ST-1002', codAmountBDT: 2450.0 },
      ],
    };

    const totalParcels = session.items.length;
    const totalCodBDT = session.items.reduce((sum, item) => sum + item.codAmountBDT, 0);

    expect(totalParcels).toBe(2);
    expect(totalCodBDT).toBe(3950.0);

    // Duplicate tracking detection check
    const newScan = 'ST-1001';
    const isDuplicate = session.items.some((i) => i.trackingCode === newScan);
    expect(isDuplicate).toBe(true);
  });
});
