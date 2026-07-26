/**
 * Who may do what.
 *
 * A manager may read every page, and may add and edit borrowers. Nothing else is
 * theirs to change: no loans, no marking payments, no messages to borrowers, no
 * money in or out. An admin may do all of it.
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
  /** Delete a borrower outright. */
  | 'borrowers.delete'
  /** Create or edit a loan, extend its tenure, change its status, accept it as owner. */
  | 'loans.write'
  /** Mark an instalment paid, partial or waived, or revert one. */
  | 'payments.write'
  /** Send a WhatsApp message to a borrower. */
  | 'messages.send'
  /** Record money into the capital pool. */
  | 'capital.write'
  /** Add or deactivate a manager. */
  | 'users.manage';

const PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'view',
    'borrowers.write',
    'borrowers.delete',
    'loans.write',
    'payments.write',
    'messages.send',
    'capital.write',
    'users.manage',
  ],
  manager: ['view', 'borrowers.write'],
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
