import { describe, it, expect } from 'vitest';
import { pickVoice, entrySentence, type VoiceLike } from './speech';

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

describe('entrySentence', () => {
  const base = { name: 'Suresh', nameTelugu: 'సురేష్', amount: 2500 } as const;

  it('reads name, amount, then what the borrower did', () => {
    expect(entrySentence({ ...base, kind: 'taken', lang: 'te' }))
      .toBe('సురేష్ రెండు వేల ఐదు వందలు ఇచ్చారు');
  });

  /*
    The verb belongs to the borrower, not the collector, and the row's own field name says
    the opposite: kind 'taken' is money the collector took, which is money the borrower
    gave. Reading it straight through produced "Suresh ... I took" — one person named, a
    different one conjugated for. Caught by ear, not by any test that existed.
  */
  it('says the borrower gave, when the collector took the money in', () => {
    expect(entrySentence({ ...base, kind: 'taken', lang: 'te' })).toContain('ఇచ్చారు');
    expect(entrySentence({ ...base, kind: 'taken', lang: 'te' })).not.toContain('తీసుకున్నారు');
  });

  it('says the borrower took, when the collector gave the money out', () => {
    expect(entrySentence({ ...base, kind: 'given', lang: 'te' })).toContain('తీసుకున్నారు');
    expect(entrySentence({ ...base, kind: 'given', lang: 'te' })).not.toContain('ఇచ్చారు');
  });

  it('uses forms that do not conjugate for gender', () => {
    /*
      No gender is recorded against a borrower, so ఇచ్చాడు / ఇచ్చింది cannot be chosen
      between and would be wrong for half the book. The honorific forms are correct for
      anyone — and this is a guard, because the masculine form is the one that sounds
      most natural in isolation and is the easy mistake to make later.
    */
    for (const kind of ['taken', 'given'] as const) {
      const said = entrySentence({ ...base, kind, lang: 'te' });
      expect(said, kind).not.toMatch(/ఇచ్చాడు|ఇచ్చింది|తీసుకున్నాడు|తీసుకుంది/);
      expect(said, kind).toMatch(/ఇచ్చారు|తీసుకున్నారు/);
    }
  });

  it('uses the Telugu spelling of the name when there is one', () => {
    expect(entrySentence({ ...base, kind: 'taken', lang: 'te' })).toContain('సురేష్');
  });

  it('falls back to the stored name when there is no Telugu spelling', () => {
    expect(entrySentence({ ...base, nameTelugu: null, kind: 'taken', lang: 'te' })).toContain('Suresh');
    expect(entrySentence({ ...base, nameTelugu: '   ', kind: 'taken', lang: 'te' })).toContain('Suresh');
  });

  describe('through an English voice', () => {
    it('gives it Latin script, never Telugu', () => {
      const said = entrySentence({ ...base, kind: 'taken', lang: 'en' });
      expect(said).toBe('Suresh gave 2,500 rupees');
      expect(said).not.toMatch(/[ఀ-౿]/);
    });

    it('keeps the borrower as the subject here too', () => {
      expect(entrySentence({ ...base, kind: 'given', lang: 'en' })).toBe('Suresh took 2,500 rupees');
    });
  });
});
