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
  // Only the applying half of the day book belongs here. Recording is a manager's job by
  // design, and is asserted separately below.
  ['applyCollectionEntry', 'collections.apply'],
  ['applyAllCollectionEntries', 'collections.apply'],
  ['discardCollectionEntry', 'collections.apply'],
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

/**
 * The day book's whole reason for existing is that these two are not the same permission.
 *
 * A collector writes down every rupee they handled and can settle none of it. If recording
 * ever starts implying applying, an untrained person on a doorstep can move the capital
 * pool, which is the outcome the staging table was built to prevent.
 */
describe('recording a collection and applying one are different powers', () => {
  it('lets a manager write in the day book', () => {
    expect(() => requirePermission(mk('manager'), 'collections.record')).not.toThrow();
  });

  it('refuses a manager the apply', () => {
    expect(() => requirePermission(mk('manager'), 'collections.apply')).toThrow(/Insu/);
  });

  it('gives an admin both', () => {
    expect(() => requirePermission(mk('admin'), 'collections.record')).not.toThrow();
    expect(() => requirePermission(mk('admin'), 'collections.apply')).not.toThrow();
  });

  it('does not let recording imply settling a payment or issuing a loan', () => {
    expect(() => requirePermission(mk('manager'), 'payments.write')).toThrow(/Insu/);
    expect(() => requirePermission(mk('manager'), 'loans.write')).toThrow(/Insu/);
  });
});
