import type { AuthUser } from './auth';
import { can, type Permission } from '@/lib/permissions';

export function requireRole(user: AuthUser, allowedRoles: Array<'admin' | 'manager'>): void {
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Insufficient permissions. Required: ${allowedRoles.join(' or ')}`);
  }
}

/**
 * Guards by what the action is rather than by who may do it today, so a change to the
 * permission table in @/lib/permissions moves the UI and the server together.
 */
export function requirePermission(user: AuthUser, permission: Permission): void {
  if (!can(user, permission)) {
    throw new Error(`Insufficient permissions for ${permission}.`);
  }
}
