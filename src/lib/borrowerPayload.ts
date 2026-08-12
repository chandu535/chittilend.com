export interface BorrowerFormData {
  name: string;
  nameTelugu: string;
  mobile: string;
  area: string;
  address: string;
  locationUrl: string;
  locationLat: number | null;
  locationLng: number | null;
  suretyType: 'owner' | 'existing_borrower';
  suretyReferenceId: string;
}

export interface BorrowerPayload {
  name: string;
  nameTelugu?: string;
  mobile: string;
  area?: string;
  address?: string;
  locationLat: number | null;
  locationLng: number | null;
  suretyType: 'owner' | 'existing_borrower';
  suretyReferenceId?: string;
}

/**
 * Turns what the form holds into what the server accepts.
 *
 * Three things have to be right, and each has bitten before:
 *
 * `locationUrl` is a working field — somewhere to paste a maps link so the coordinates
 * can be read out of it — and is not a column. The schema rejects unknown keys, so
 * leaving it in fails the whole save.
 *
 * A location captured alongside the photo only fills a blank. Someone who pasted a maps
 * link, or pressed the capture button on the details step, has said where the borrower
 * lives; a GPS fix taken wherever the photo happened to be must not overwrite that.
 *
 * Empty optional fields go as undefined rather than "". The schema tolerates both, but
 * an empty string would overwrite a real value on the update path, which runs whenever a
 * save is retried after a failed photo upload.
 */
export function toBorrowerPayload(
  form: BorrowerFormData,
  photoLocation: { lat: number; lng: number } | null,
): BorrowerPayload {
  const { locationUrl: _ignored, ...rest } = form;

  const hasOwnLocation = rest.locationLat !== null && rest.locationLng !== null;
  const usePhoto = photoLocation !== null && !hasOwnLocation;

  return {
    name: rest.name.trim(),
    nameTelugu: rest.nameTelugu.trim() || undefined,
    mobile: rest.mobile,
    area: rest.area.trim() || undefined,
    address: rest.address.trim() || undefined,
    locationLat: usePhoto ? photoLocation.lat : rest.locationLat,
    locationLng: usePhoto ? photoLocation.lng : rest.locationLng,
    suretyType: rest.suretyType,
    suretyReferenceId: rest.suretyType === 'existing_borrower'
      ? rest.suretyReferenceId || undefined
      : undefined,
  };
}

/**
 * Makes a dictated name acceptable to the name field.
 *
 * Speech recognition punctuates: it returns "సుబ్బమ్మ." or slips in a comma between
 * words. The schema permits Telugu and Latin letters, spaces, and the apostrophe, dot and
 * hyphen that appear in real names — anything else is rejected, and the borrower would be
 * turned away at save time over a stray mark nobody typed.
 *
 * Stripping rather than rejecting: what was heard is right, only the punctuation is not.
 *
 * A dot is kept inside a name, because initials are real — "K. Venkata" — but removed
 * from either end, which is where dictation puts a full stop.
 */
export function sanitiseSpokenName(spoken: string): string {
  return spoken
    .replace(/[^ఀ-౿a-zA-Z\s.\-']/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\.{2,}/g, '.')
    .replace(/^[\s.\-']+|[\s.\-']+$/g, '');
}

/**
 * Makes a dictated area or address usable, which is a looser job than a name.
 *
 * A name is letters. An address is not: "12-3/A, Balaji Nagar, near the water tank" is an
 * ordinary one here, and sanitiseSpokenName would take the digits, the comma and the slash
 * out and leave something that is no longer an address. So the two cannot share a rule, and
 * this keeps the marks a place needs — digits, comma, dot, hyphen, slash, ampersand and
 * brackets — while still dropping what dictation invents around them.
 *
 * The end punctuation still goes. A spoken address comes back with a full stop on it, and
 * "Balaji Nagar." is not how anyone writes it down.
 *
 * Neither field is validated at save, unlike the name, so nothing here is protecting the
 * schema. It is protecting the ledger from tidy-looking rubbish: an address is read by a
 * person standing in a street trying to find a house.
 */
export function sanitiseSpokenPlace(spoken: string): string {
  return spoken
    .replace(/[^ఀ-౿a-zA-Z0-9\s.,\-/&()']/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/,{2,}/g, ',')
    .replace(/^[\s.,\-/&]+|[\s.,\-/&]+$/g, '');
}
