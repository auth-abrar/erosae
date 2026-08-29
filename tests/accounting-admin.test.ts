import { describe, it, expect } from 'vitest';
import { Money } from '../src/lib/money';

describe('Admin Double-Entry Accounting Ledger Engine', () => {
  it('should validate a balanced two-line journal entry', () => {
    const lines = [
      { accountId: 'acc-cash', debitBDT: 1500.50, creditBDT: 0 },
      { accountId: 'acc-sales', debitBDT: 0, creditBDT: 1500.50 },
    ];
    expect(Money.isJournalBalanced(lines)).toBe(true);
  });

  it('should validate a multi-line balanced compound journal entry', () => {
    const lines = [
      { accountId: 'acc-cash', debitBDT: 5000.00, creditBDT: 0 },
      { accountId: 'acc-vat-receivable', debitBDT: 750.00, creditBDT: 0 },
      { accountId: 'acc-sales-revenue', debitBDT: 0, creditBDT: 5000.00 },
      { accountId: 'acc-vat-payable', debitBDT: 0, creditBDT: 750.00 },
    ];
    expect(Money.isJournalBalanced(lines)).toBe(true);
  });

  it('should reject an unbalanced journal entry where debit != credit', () => {
    const unbalancedLines = [
      { accountId: 'acc-cash', debitBDT: 2000.00, creditBDT: 0 },
      { accountId: 'acc-sales', debitBDT: 0, creditBDT: 1999.00 },
    ];
    expect(Money.isJournalBalanced(unbalancedLines)).toBe(false);
  });
});
