import { describe, it, expect } from 'vitest';
import { toBorrowerPayload, sanitiseSpokenName, type BorrowerFormData } from './borrowerPayload';

const form = (over: Partial<BorrowerFormData> = {}): BorrowerFormData => ({
  name: 'Venkata Rao',
  nameTelugu: '',
  mobile: '9876543210',
  area: '',
  address: '',
  locationUrl: '',
  locationLat: null,
  locationLng: null,
  suretyType: 'owner',
  suretyReferenceId: '',
  ...over,
});

describe('toBorrowerPayload', () => {
  it('drops locationUrl, which is a working field and not a column', () => {
    // The schema rejects unknown keys, so leaving it in fails the entire save.
    expect(toBorrowerPayload(form({ locationUrl: 'https://maps.google.com/?q=1,2' }), null))
      .not.toHaveProperty('locationUrl');
  });

  describe('where the borrower lives', () => {
    it('takes the location from the photo when none was given', () => {
      const p = toBorrowerPayload(form(), { lat: 16.5, lng: 81.5 });
      expect(p.locationLat).toBe(16.5);
      expect(p.locationLng).toBe(81.5);
    });

    it('keeps a location entered by hand over one from the photo', () => {
      // Someone who pasted a maps link has said where the borrower lives. A GPS fix taken
      // wherever the photo happened to be must not overwrite that.
      const p = toBorrowerPayload(form({ locationLat: 17.4, locationLng: 78.4 }), { lat: 16.5, lng: 81.5 });
      expect(p.locationLat).toBe(17.4);
      expect(p.locationLng).toBe(78.4);
    });

    it('leaves it empty when there is neither', () => {
      const p = toBorrowerPayload(form(), null);
      expect(p.locationLat).toBeNull();
      expect(p.locationLng).toBeNull();
    });

    it('does not take half a coordinate pair from the form', () => {
      // A latitude with no longitude is not a location; the photo's fix is better.
      const p = toBorrowerPayload(form({ locationLat: 17.4, locationLng: null }), { lat: 16.5, lng: 81.5 });
      expect(p.locationLat).toBe(16.5);
      expect(p.locationLng).toBe(81.5);
    });
  });

  describe('optional fields', () => {
    it('sends undefined rather than empty strings', () => {
      // On the update path — which runs when a save is retried after a failed photo
      // upload — an empty string would overwrite a real value.
      const p = toBorrowerPayload(form(), null);
      expect(p.nameTelugu).toBeUndefined();
      expect(p.area).toBeUndefined();
      expect(p.address).toBeUndefined();
    });

    it('keeps values that were filled in, trimmed', () => {
      const p = toBorrowerPayload(form({ area: ' Ongole ', nameTelugu: ' వెంకట రావు ' }), null);
      expect(p.area).toBe('Ongole');
      expect(p.nameTelugu).toBe('వెంకట రావు');
      expect(p.name).toBe('Venkata Rao');
    });
  });

  describe('surety', () => {
    it('omits the reference when the owner stands surety', () => {
      // The schema only permits a reference when the type calls for one.
      const p = toBorrowerPayload(form({ suretyType: 'owner', suretyReferenceId: 'stale-id' }), null);
      expect(p.suretyReferenceId).toBeUndefined();
    });

    it('carries the reference when another borrower stands surety', () => {
      const id = '11111111-1111-1111-1111-111111111111';
      const p = toBorrowerPayload(form({ suretyType: 'existing_borrower', suretyReferenceId: id }), null);
      expect(p.suretyReferenceId).toBe(id);
    });
  });

  it('sends only keys the schema allows', () => {
    const allowed = new Set([
      'name', 'nameTelugu', 'mobile', 'area', 'address',
      'locationLat', 'locationLng', 'suretyType', 'suretyReferenceId',
    ]);
    const p = toBorrowerPayload(form({ locationUrl: 'x', area: 'Ongole' }), { lat: 1, lng: 2 });
    for (const key of Object.keys(p)) expect(allowed.has(key)).toBe(true);
  });
});

describe('sanitiseSpokenName', () => {
  it('keeps a Telugu name as it was heard', () => {
    expect(sanitiseSpokenName('సుబ్బమ్మ')).toBe('సుబ్బమ్మ');
  });

  it('drops the punctuation speech recognition adds', () => {
    // The schema rejects these, so the save would fail over a mark nobody typed.
    expect(sanitiseSpokenName('సుబ్బమ్మ.')).toBe('సుబ్బమ్మ');
    expect(sanitiseSpokenName('విల్లూరి, నాగరాజు')).toBe('విల్లూరి నాగరాజు');
    expect(sanitiseSpokenName('నాగరాజు?')).toBe('నాగరాజు');
  });

  it('keeps the marks that appear in real names', () => {
    expect(sanitiseSpokenName("D'Souza")).toBe("D'Souza");
    expect(sanitiseSpokenName('Rama-Krishna')).toBe('Rama-Krishna');
  });

  it('tidies spacing so a name is not stored with gaps in it', () => {
    expect(sanitiseSpokenName('  వెంకట   రావు  ')).toBe('వెంకట రావు');
  });

  it('strips digits, which are never part of a name here', () => {
    expect(sanitiseSpokenName('వెంకట 123')).toBe('వెంకట');
  });

  it('keeps a dot inside a name, where initials live', () => {
    expect(sanitiseSpokenName('K. Venkata')).toBe('K. Venkata');
  });

  it('returns nothing for a result that was only punctuation', () => {
    // The caller ignores an empty result rather than writing a blank name.
    expect(sanitiseSpokenName('...')).toBe('');
    expect(sanitiseSpokenName('!!!')).toBe('');
  });
});
