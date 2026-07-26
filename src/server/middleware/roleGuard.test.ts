import { describe, it, expect } from 'vitest';
import { requirePermission } from '@/server/middleware/roleGuard';
import type { AuthUser } from '@/server/middleware/auth';

const mk = (role: 'admin' | 'manager') =>
  ({ id: 'u', name: 'n', email: 'e', role }) as AuthUser;

// Exactly the permission each write endpoint now guards on, taken from the source.
const ENDPOINTS: Array<[string, Parameters<typeof requirePermission>[1]]> = [
  ['createLoan', 'loans.write'], ['updateLoan', 'loans.write'],
  ['extendTenure', 'loans.write'], ['changeStatus', 'loans.write'],
  ['acceptLoanAsOwner', 'loans.write'],
  ['markPaymentPaid', 'payments.write'], ['markPaymentPartial', 'payments.write'],
  ['markPaymentWaived', 'payments.write'], ['revertPayment', 'payments.write'],
  ['sendPaymentWarningWhatsApp', 'messages.send'], ['sendLoanWelcomeWhatsApp', 'messages.send'],
  ['sendLoanWhatsAppTemplate', 'messages.send'],
  ['addInvestment', 'capital.write'],
  ['createManager', 'users.manage'], ['toggleManagerActive', 'users.manage'],
  ['deleteBorrower', 'borrowers.delete'],
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
});
