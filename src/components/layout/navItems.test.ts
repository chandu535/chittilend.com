import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BOTTOM_NAV_ITEMS,
  BOTTOM_NAV_PATHS,
  NAV_ITEMS,
  NEW_LOAN_ITEM,
  OVERFLOW_ITEMS,
  visibleTo,
} from './navItems';

/**
 * Every page must be reachable on a phone, and reachable exactly once.
 *
 * This is written from a bug rather than from a worry. BottomNav held its own hardcoded
 * list of five destinations while BOTTOM_NAV_PATHS governed only what fell *out* of the bar
 * and into the profile menu. Swapping Borrowers for Collections therefore did neither thing
 * it looked like it did: Collections had no way in on a phone, and Borrowers appeared in
 * both the bar and the menu. Nothing failed — it just quietly stopped being navigable.
 */
describe('phone navigation', () => {
  it('gives the bar an item for every path it declares', () => {
    // A path that resolves to nothing is silently dropped from the bar, which is the
    // failure mode that has no symptom until someone goes looking for the page.
    expect(BOTTOM_NAV_ITEMS.map((item) => item.to)).toEqual(BOTTOM_NAV_PATHS);
  });

  it('reaches every destination exactly once, from the bar or the menu', () => {
    const reachable = [
      ...BOTTOM_NAV_ITEMS.map((item) => item.to),
      ...OVERFLOW_ITEMS.map((item) => item.to),
    ];

    for (const item of NAV_ITEMS) {
      const times = reachable.filter((to) => to === item.to).length;
      expect(times, `${item.to} is reachable ${times} times on a phone`).toBe(1);
    }
  });

  it('does not list the same page in the bar and the menu', () => {
    const inBar = new Set(BOTTOM_NAV_ITEMS.map((item) => item.to));
    for (const item of OVERFLOW_ITEMS) {
      expect(inBar.has(item.to), `${item.to} is in both the bar and the menu`).toBe(false);
    }
  });

  it('keeps new-loan out of the sidebar, since it is an action rather than a page', () => {
    expect(NAV_ITEMS.map((item) => item.to)).not.toContain(NEW_LOAN_ITEM.to);
    expect(BOTTOM_NAV_ITEMS).toContain(NEW_LOAN_ITEM);
  });

  it('puts the day book in the bar and borrowers in the menu', () => {
    // The trade this screen was added for, asserted so it cannot be undone by accident.
    expect(BOTTOM_NAV_ITEMS.map((item) => item.to)).toContain('/collections');
    expect(OVERFLOW_ITEMS.map((item) => item.to)).toContain('/borrowers');
  });

  it('hides admin-only destinations from a manager', () => {
    const forManager = visibleTo(NAV_ITEMS, 'manager');
    expect(forManager.some((item) => item.adminOnly)).toBe(false);
    expect(visibleTo(NAV_ITEMS, 'admin')).toHaveLength(NAV_ITEMS.length);
  });

  it('leaves a manager the whole bar, since none of it is admin-only', () => {
    // A collector is a manager. If a bar slot ever becomes admin-only they lose a tab and
    // the bar renders with a gap, so this is worth knowing about at the time.
    expect(visibleTo(BOTTOM_NAV_ITEMS, 'manager')).toHaveLength(BOTTOM_NAV_ITEMS.length);
  });
});

/**
 * The check above proves navItems.tsx agrees with itself. This one proves the bar actually
 * reads it.
 *
 * That distinction is the whole bug: every assertion about reachability passed while
 * BottomNav rendered a private list of five hardcoded destinations, because nothing
 * connected the two files. A derived list is only derived if its consumer uses it, so this
 * reads the source and says so.
 */
describe('the bottom bar is rendered from the shared list', () => {
  const source = readFileSync(join(__dirname, 'BottomNav.tsx'), 'utf8');

  it('takes its items from navItems', () => {
    expect(source).toContain('BOTTOM_NAV_ITEMS');
  });

  it('declares no destinations of its own', () => {
    // `to: '/loans'` and friends. Any of these means a second list has grown back, and the
    // two will disagree the next time one of them is edited.
    const ownPaths = source.match(/to:\s*'\/[^']*'/g) ?? [];
    expect(
      ownPaths,
      `BottomNav.tsx hardcodes ${ownPaths.join(', ')} instead of using BOTTOM_NAV_ITEMS`,
    ).toEqual([]);
  });
});
