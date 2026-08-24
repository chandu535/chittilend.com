import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Language defaults must not outrank a size chosen at the call site.
 *
 * Written from a bug that only showed up on some phones, which made it look like a device
 * problem. It was not: the language is stored per device, and `[lang="te"] input` was
 * unlayered while every Tailwind size utility lives in `@layer utilities`. Unlayered CSS
 * always beats layered CSS, whatever the specificity — so switching the app to Telugu
 * forced *every* input in it to 16px. The collections amount field is set to text-5xl,
 * 48px, and rendered at a third of that.
 *
 * These rules read the stylesheet because that cascade cannot be asserted from a rendered
 * component without a real browser, and the failure is silent: nothing errors, the number
 * is just small.
 */
// Comments are stripped first, or a selector merely *discussed* in a comment is found
// instead of the rule — including the comment directly above the rule this guards.
const CSS = readFileSync(join(__dirname, 'styles.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

/** The block a rule sits in, or null when it is unlayered. */
function enclosingLayer(needle: string): string | null {
  const target = CSS.indexOf(needle);
  if (target < 0) throw new Error(`not found in styles.css: ${needle}`);

  const stack: { name: string; depth: number }[] = [];
  for (let i = 0; i < target; i++) {
    if (CSS.startsWith('@layer', i)) {
      const brace = CSS.indexOf('{', i);
      const semi = CSS.indexOf(';', i);
      // `@layer a, b;` declares an order and opens nothing.
      if (semi !== -1 && (brace === -1 || semi < brace)) { i = semi; continue; }
      stack.push({ name: CSS.slice(i + 6, brace).trim(), depth: 1 });
      i = brace;
      continue;
    }
    if (CSS[i] === '{' && stack.length) stack[stack.length - 1].depth++;
    if (CSS[i] === '}' && stack.length && --stack[stack.length - 1].depth === 0) stack.pop();
  }
  return stack.length ? stack[stack.length - 1].name : null;
}

describe('language rules do not outrank deliberate sizes', () => {
  it('keeps the Telugu input defaults in a layer', () => {
    expect(
      enclosingLayer('[lang="te"] input'),
      'The Telugu input rule is unlayered again, so it beats every Tailwind size utility '
      + 'and any input with an explicit size renders at 16px in Telugu.',
    ).toBe('base');
  });

  it('sets no font-size on a bare element outside a layer', () => {
    // A bare `input`/`td`/`h1` rule outside a layer is the shape of the bug: it silently
    // outranks utilities everywhere. Rules targeting the app's own classes are fine — they
    // were written to override on purpose.
    const unlayered = [...CSS.matchAll(/^(\[lang="te"\]\s+)?(input|textarea|select|td|button|a)\b[^{]*\{[^}]*font-size[^}]*\}/gm)]
      .filter((m) => enclosingLayer(m[0].slice(0, 24)) === null)
      .map((m) => m[0].split('\n')[0]);

    expect(
      unlayered,
      `Unlayered font-size on a bare element:\n${unlayered.join('\n')}\n`
      + 'Put it in @layer base so a size set at the call site still wins.',
    ).toEqual([]);
  });
});
