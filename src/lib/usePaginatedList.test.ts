import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A source guard, and a weaker one than this deserves.
 *
 * The real assertion wants a rendered hook: switch the resetKey and watch what the list
 * reports while the fetch is in flight. That cannot run here — jsdom is broken in this
 * project (html-encoding-sniffer requires an ESM module from CommonJS), so every test using
 * a DOM environment fails before it starts. Reading the source is what is left.
 *
 * It guards a pairing that has already gone wrong once in each direction. Keeping the rows
 * through a reset is right for a filter and wrong for a tab: the old rows read as belonging
 * to the tab just opened. Clearing them without also clearing `loadedOnce` is wrong too,
 * because `showSkeleton` is `loading && !loadedOnce` — so the list says there is no data,
 * then produces some. The two lines have to move together.
 */
const SOURCE = readFileSync(join(__dirname, 'usePaginatedList.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');

describe('clearing a list and showing its skeleton stay together', () => {
  it('resets loadedOnce wherever it empties the items', () => {
    const branch = SOURCE.match(/if\s*\(\s*clearOnReset\s*\)\s*\{[\s\S]*?\n\s{4}\}/);

    expect(branch, 'the clearOnReset branch has gone; this guard is now watching nothing').not.toBeNull();
    expect(
      branch![0],
      'clearOnReset empties the items without resetting loadedOnce, so showSkeleton — '
      + 'which is `loading && !loadedOnce` — stays false and the emptied list renders as '
      + '"no data" until the fetch lands.',
    ).toContain('loadedOnce.current = false');
  });

  it('still derives the skeleton from loadedOnce, which is what makes the above matter', () => {
    // If this ever stops being the derivation, the guard above is guarding the wrong thing.
    expect(SOURCE).toMatch(/showSkeleton:\s*loading\s*&&\s*!loadedOnce\.current/);
  });

  it('leaves the default alone, so a filter still dims rather than blanking', () => {
    expect(SOURCE).toMatch(/clearOnReset\s*=\s*false/);
  });
});
