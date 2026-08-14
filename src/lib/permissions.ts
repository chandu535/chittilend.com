/**
 * Who may do what.
 *
 * A manager may read every page, and may add and edit borrowers. Nothing else is
 * theirs to change: no loans, no marking payments, no messages to borrowers, no
 * money in or out, and nothing removed. An admin may do all of it.
 *
 * Deleting is split three ways rather than held under one flag. Binning is reversible and
 * purging is not, so they are worth separating even while the same person holds both —
 * it leaves somewhere to stand if a second admin should ever be able to tidy up without
 * being able to destroy anything.
 *
 * Both the server guards and the UI import from here, so a hidden button and a
 * refused request always agree. The UI use is only to avoid offering an action that
 * would fail — the server check is the one that enforces it.
 */
import type { AuthUser } from '@/server/middleware/auth';

export type Role = 'admin' | 'manager';

export type Permission =
  /** Read any list or detail page. */
  | 'view'
  /** Create a borrower, edit one, upload their photo, reissue their portal link. */
  | 'borrowers.write'
  /** See the Bin and what is in it. */
  | 'bin.view'
  /** Move a loan or a borrower to the Bin, and restore one from it. */
  | 'bin.write'
  /** Destroy something in the Bin for good. */
  | 'bin.purge'
  /** Issue a new loan. */
  | 'loans.create'
  /** Edit a loan, extend its tenure, change its status, accept it as owner. */
  | 'loans.write'
  /** Mark an instalment paid, partial or waived, or revert one. */
  | 'payments.write'
  /** Send a WhatsApp message to a borrower. */
  | 'messages.send'
  /** Record money into the capital pool. */
  | 'capital.write'
  /** Add or deactivate a manager. */
  | 'users.manage'
  /**
   * Write a line in the collection day book. Deliberately not payments.write: an entry is
   * a claim about what happened at a doorstep, and it moves no money until it is applied.
   */
  | 'collections.record'
  /**
   * Turn those claims into real payments and real loans. This is the one that spends
   * money, so it stays with the owner however routine the recording becomes.
   */
  | 'collections.apply';

const PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'view',
    'borrowers.write',
    'bin.view',
    'bin.write',
    'bin.purge',
    'loans.create',
    'loans.write',
    'payments.write',
    'messages.send',
    'capital.write',
    'users.manage',
    'collections.record',
    'collections.apply',
  ],
  // Issuing a loan is day-to-day work; extending a tenure, marking someone defaulted and
  // signing the owner's acceptance are decisions about a debt, and stay with the owner.
  // collections.record without payments.write is the point of the day book: a collector
  // can write down every rupee they handled without being able to settle an instalment or
  // issue a loan. What they wrote waits for an admin.
  manager: ['view', 'borrowers.write', 'loans.create', 'collections.record'],
};

export function can(
  user: Pick<AuthUser, 'role'> | null | undefined,
  permission: Permission,
): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role]?.includes(permission) ?? false;
}

/** Every role that holds a permission — for the server guards. */
export function rolesWith(permission: Permission): Role[] {
  return (Object.keys(PERMISSIONS) as Role[]).filter((role) =>
    PERMISSIONS[role].includes(permission),
  );
}
