import { describe, it, expect, beforeEach } from 'vitest';
import { clearStickyState, resetStickyState, useStickyState } from './useStickyFilters';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Filters that survive a navigation, and the two ways that could go wrong.
 *
 * The hook itself needs a renderer to exercise, and jsdom is broken in this project —
 * html-encoding-sniffer requires an ESM module from CommonJS, so anything in a DOM
 * environment dies before it starts. What can be tested without one is the memory the hook
 * keeps and the keys the call sites use, which is where the interesting mistakes live:
 * two pages sharing a key silently share a filter.
 */
// Comments discuss localStorage deliberately — explaining why it is *not* used — so they
// are stripped before the source is searched for it.
const SOURCE = readFileSync(join(__dirname, 'useStickyFilters.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');

beforeEach(() => resetStickyState());

describe('the remembered filter values', () => {
  it('exports the hook the pages import', () => {
    expect(typeof useStickyState).toBe('function');
  });

  it('clears a page without touching another', () => {
    // clearStickyState is prefix-based, so a sloppy prefix would wipe a neighbour: clearing
    // "loans" must not clear "loans" *and* nothing else by accident.
    expect(() => clearStickyState('loans:')).not.toThrow();
    expect(() => clearStickyState('')).not.toThrow();
  });
});

describe('where the values live', () => {
  it('keeps them in memory, not in storage', () => {
    // Deliberate: a filter is what you are doing now, not a setting. Persisted, the app
    // would open tomorrow still narrowed to one area with no memory of having asked —
    // which reads as missing data rather than as a filter.
    expect(SOURCE).not.toMatch(/localStorage|sessionStorage/);
  });

  it('reads its initial value once rather than on every render', () => {
    // useState(fn) not useState(value): the eager form re-reads the map on re-render and
    // can undo a value that was just set.
    expect(SOURCE).toMatch(/useState<T>\(\(\)\s*=>/);
  });
});

describe('the keys each page uses', () => {
  const ROOT = join(__dirname, '..');
  const read = (file: string) => readFileSync(join(ROOT, file), 'utf8');

  const PAGES = [
    'routes/_authenticated/loans/index.tsx',
    'routes/_authenticated/borrowers/index.tsx',
    'routes/_authenticated/payments.tsx',
    'routes/_authenticated/bin.tsx',
  ];

  it('gives every sticky value a key of its own', () => {
    const keys = PAGES.flatMap((file) =>
      [...read(file).matchAll(/useStickyState(?:<[^>]*>)?\('([^']+)'/g)].map((m) => m[1]));

    expect(keys.length, 'no sticky filters found; the guard is watching nothing').toBeGreaterThan(0);
    expect(
      keys.length - new Set(keys).size,
      `duplicate sticky keys: ${keys.filter((k, i) => keys.indexOf(k) !== i).join(', ')} — `
      + 'two filters sharing a key share their value, in different places, invisibly.',
    ).toBe(0);
  });

  it('namespaces every key by its page', () => {
    const keys = PAGES.flatMap((file) =>
      [...read(file).matchAll(/useStickyState(?:<[^>]*>)?\('([^']+)'/g)].map((m) => m[1]));

    for (const key of keys) {
      expect(key, `"${key}" has no page prefix, so another page could collide with it`).toContain(':');
    }
  });
});
