import { describe, it, expect } from 'vitest';
import { teluguNumberWords } from './teluguNumbers';

/**
 * The wording a collector will hear.
 *
 * Pinned against the amounts that actually occur, taken from the ledger rather than
 * invented: ₹2,500 appears 722 times, ₹5,000 653 times, ₹7,500 110, ₹12,500 71. Those four
 * are most of the day book, so they are checked exactly rather than by rule.
 *
 * The irregular forms have their own cases because each is a place where a plausible-looking
 * converter says something that is not Telugu — ఒకటి వేలు for a thousand, or ఐదు వేలు ఐదు
 * వందలు where the first component should be oblique.
 */
describe('teluguNumberWords', () => {
  describe('the amounts this ledger is actually made of', () => {
    it.each([
      [2500, 'రెండు వేల ఐదు వందలు'],
      [5000, 'ఐదు వేలు'],
      [7500, 'ఏడు వేల ఐదు వందలు'],
      [12500, 'పన్నెండు వేల ఐదు వందలు'],
      [10000, 'పది వేలు'],
      [3750, 'మూడు వేల ఏడు వందల యాభై'],
      [20000, 'ఇరవై వేలు'],
    ])('%i', (n, expected) => {
      expect(teluguNumberWords(n)).toBe(expected);
    });
  });

  describe('the irregular forms', () => {
    it('says వెయ్యి for one thousand, never ఒకటి వేలు', () => {
      expect(teluguNumberWords(1000)).toBe('వెయ్యి');
      expect(teluguNumberWords(1500)).toBe('వెయ్యి ఐదు వందలు');
    });

    it('says వంద for one hundred, and నూట when something follows', () => {
      expect(teluguNumberWords(100)).toBe('వంద');
      expect(teluguNumberWords(150)).toBe('నూట యాభై');
      expect(teluguNumberWords(101)).toBe('నూట ఒకటి');
    });

    it('uses the oblique form when a component has something after it', () => {
      // వేలు standing alone, వేల with a remainder — the same distinction for వందలు.
      expect(teluguNumberWords(2000)).toBe('రెండు వేలు');
      expect(teluguNumberWords(2001)).toBe('రెండు వేల ఒకటి');
      expect(teluguNumberWords(200)).toBe('రెండు వందలు');
      expect(teluguNumberWords(205)).toBe('రెండు వందల ఐదు');
    });

    it('gives 11 to 19 their own words', () => {
      expect(teluguNumberWords(11)).toBe('పదకొండు');
      expect(teluguNumberWords(15)).toBe('పదిహేను');
      expect(teluguNumberWords(19)).toBe('పంతొమ్మిది');
      // and not a "ten five" construction
      expect(teluguNumberWords(15)).not.toContain('పది ');
    });
  });

  describe('tens and units', () => {
    it.each([
      [1, 'ఒకటి'], [9, 'తొమ్మిది'], [10, 'పది'], [20, 'ఇరవై'],
      [21, 'ఇరవై ఒకటి'], [50, 'యాభై'], [99, 'తొంభై తొమ్మిది'],
    ])('%i', (n, expected) => {
      expect(teluguNumberWords(n)).toBe(expected);
    });
  });

  describe('lakhs', () => {
    it.each([
      [100000, 'లక్ష'],
      [200000, 'రెండు లక్షలు'],
      [250000, 'రెండు లక్షల యాభై వేలు'],
      [125000, 'లక్ష ఇరవై ఐదు వేలు'],
    ])('%i', (n, expected) => {
      expect(teluguNumberWords(n)).toBe(expected);
    });
  });

  describe('what it refuses to mangle', () => {
    it('rounds paise away rather than reading them out', () => {
      // Instalments divide into paise; a collector counts notes.
      expect(teluguNumberWords(4166.67)).toBe('నాలుగు వేల నూట అరవై ఏడు');
      expect(teluguNumberWords(2499.5)).toBe('రెండు వేల ఐదు వందలు');
    });

    it('says zero rather than an empty string', () => {
      expect(teluguNumberWords(0)).toBe('సున్నా');
    });

    it('reads a negative as its magnitude, since direction is said separately', () => {
      expect(teluguNumberWords(-5000)).toBe('ఐదు వేలు');
    });

    it('never returns an empty or ragged string across a wide sweep', () => {
      for (let n = 1; n <= 3000; n++) {
        const words = teluguNumberWords(n);
        expect(words.trim(), `${n}`).toBe(words);
        expect(words.length, `${n}`).toBeGreaterThan(0);
        expect(words, `${n}`).not.toMatch(/\s{2}/);
      }
    });

    it('never leaves a stray unit word where a special form belongs', () => {
      // ఒకటి must not appear as a multiplier — no "ఒకటి వేలు", no "ఒకటి వందలు".
      for (const n of [100, 1000, 100000, 1100, 101000]) {
        expect(teluguNumberWords(n), `${n}`).not.toMatch(/ఒకటి (వేలు|వేల|వందలు|వందల|లక్ష)/);
      }
    });
  });
});

