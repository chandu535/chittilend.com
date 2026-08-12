import { describe, it, expect } from 'vitest';
import { requirePermission } from '@/server/middleware/roleGuard';
import type { AuthUser } from '@/server/middleware/auth';

const mk = (role: 'admin' | 'manager') =>
  ({ id: 'u', name: 'n', email: 'e', role }) as AuthUser;

// Exactly the permission each write endpoint now guards on, taken from the source.
const ENDPOINTS: Array<[string, Parameters<typeof requirePermission>[1]]> = [
  ['updateLoan', 'loans.write'],
  ['addInstallments', 'loans.write'], ['changeStatus', 'loans.write'],
  ['acceptLoanAsOwner', 'loans.write'],
  ['markPaymentPaid', 'payments.write'], ['markPaymentPartial', 'payments.write'],
  ['markPaymentWaived', 'payments.write'], ['revertPayment', 'payments.write'],
  ['sendPaymentWarningWhatsApp', 'messages.send'], ['sendLoanWelcomeWhatsApp', 'messages.send'],
  ['sendLoanWhatsAppTemplate', 'messages.send'],
  ['addInvestment', 'capital.write'],
  ['createManager', 'users.manage'], ['toggleManagerActive', 'users.manage'],
  ['binLoan', 'bin.write'], ['binBorrower', 'bin.write'],
  ['restoreLoan', 'bin.write'], ['restoreBorrower', 'bin.write'],
  ['purgeLoan', 'bin.purge'], ['purgeBorrower', 'bin.purge'],
  ['listBinnedLoans', 'bin.view'], ['listBinnedBorrowers', 'bin.view'],
];

describe('a manager is refused every write outside their module', () => {
  it.each(ENDPOINTS)('%s', (_name, perm) => {
    expect(() => requirePermission(mk('manager'), perm)).toThrow(/Insufficient permissions/);
    expect(() => requirePermission(mk('admin'), perm)).not.toThrow();
  });
});

describe('a manager keeps their own module', () => {
  it.each(['createBorrower', 'updateBorrower', 'generateNewMagicLink', 'uploadBorrowerPhoto'])(
    '%s', () => {
      expect(() => requirePermission(mk('manager'), 'borrowers.write')).not.toThrow();
    });

  it('createLoan — issuing a loan is day-to-day work', () => {
    expect(() => requirePermission(mk('manager'), 'loans.create')).not.toThrow();
  });
});
