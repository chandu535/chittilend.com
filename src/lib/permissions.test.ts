import { describe, it, expect } from 'vitest';
import { can, rolesWith, type Permission } from './permissions';

const admin = { role: 'admin' as const };
const manager = { role: 'manager' as const };

describe('permissions', () => {
  it('lets a manager read every page', () => {
    expect(can(manager, 'view')).toBe(true);
  });

  it('lets a manager add and edit borrowers — their one module', () => {
    expect(can(manager, 'borrowers.write')).toBe(true);
  });

  it.each<Permission>([
    'loans.write',
    'payments.write',
    'messages.send',
    'capital.write',
    'users.manage',
    'borrowers.delete',
  ])('denies a manager %s', (permission) => {
    expect(can(manager, permission)).toBe(false);
  });

  it('grants an admin everything a manager holds, and more', () => {
    const managerHolds: Permission[] = ['view', 'borrowers.write'];
    for (const permission of managerHolds) expect(can(admin, permission)).toBe(true);
    expect(can(admin, 'loans.write')).toBe(true);
  });

  it('treats a signed-out visitor as holding nothing', () => {
    expect(can(null, 'view')).toBe(false);
    expect(can(undefined, 'borrowers.write')).toBe(false);
  });

  it('reports which roles hold a permission, for the server guards', () => {
    expect(rolesWith('borrowers.write').sort()).toEqual(['admin', 'manager']);
    expect(rolesWith('payments.write')).toEqual(['admin']);
  });
});
