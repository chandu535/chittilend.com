import { describe, it, expect } from 'vitest';
import { pickVoice, type VoiceLike } from './speech';

const voice = (lang: string, name = lang): VoiceLike => ({ lang, name });

/**
 * Which voice gets picked decides which language the sentence is written in, so the two are
 * tested together. Getting this pair out of step is the failure that matters: Telugu words
 * sent to an English voice are not accented, they are noise.
 */
describe('pickVoice', () => {
  it('takes Telugu whenever the phone has it', () => {
    const chosen = pickVoice([voice('en-US'), voice('te-IN'), voice('hi-IN')]);
    expect(chosen).toEqual({ voice: voice('te-IN'), lang: 'te' });
  });

  it('accepts a bare te tag, not only te-IN', () => {
    expect(pickVoice([voice('te')])?.lang).toBe('te');
  });

  it('is not confused by case or an underscore tag', () => {
    expect(pickVoice([voice('TE-IN')])?.lang).toBe('te');
    expect(pickVoice([voice('en_IN')])?.voice.lang).toBe('en_IN');
  });

  describe('without Telugu', () => {
    it('prefers Indian English, which handles these names and amounts best', () => {
      const chosen = pickVoice([voice('en-US'), voice('en-GB'), voice('en-IN')]);
      expect(chosen?.voice.lang).toBe('en-IN');
      expect(chosen?.lang).toBe('en');
    });

    it('falls back to any English rather than going silent', () => {
      expect(pickVoice([voice('en-US')])).toEqual({ voice: voice('en-US'), lang: 'en' });
    });

    it('does not press a Hindi voice into service', () => {
      // Devanagari and Telugu are different scripts; a hi-IN voice cannot read either the
      // Telugu sentence or, usefully, the Latin one.
      expect(pickVoice([voice('hi-IN'), voice('fr-FR')])).toBeNull();
    });
  });

  it('says nothing at all when there is no usable voice', () => {
    expect(pickVoice([])).toBeNull();
    expect(pickVoice([voice('ja-JP')])).toBeNull();
  });

  it('ignores malformed entries instead of throwing', () => {
    const ragged = [{ lang: '', name: 'x' }, undefined as unknown as VoiceLike, voice('te-IN')];
    expect(pickVoice(ragged)?.lang).toBe('te');
  });
});
