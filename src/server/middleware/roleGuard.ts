import type { AuthUser } from './auth';

export function requireRole(user: AuthUser, allowedRoles: Array<'admin' | 'manager'>): void {
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Insufficient permissions. Required: ${allowedRoles.join(' or ')}`);
  }
}
