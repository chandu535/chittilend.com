import { describe, it, expect, vi, afterEach } from 'vitest';
import { isInternalError, userFacingError } from './userError';

/** The real thing, trimmed: what a missing table put on the collections screen. */
const REAL_DUMP = 'Failed query: select "collection_entries"."id", "collection_entries"."kind", '
  + '"collection_entries"."amount", "collection_entries"."status", "borrowers"."name", '
  + '"borrowers"."mobile" from "collection_entries" inner join "borrowers" on '
  + '"collection_entries"."borrower_id" = "borrowers"."id" where ("borrowers"."deleted_at") '
  + 'order by "collection_entries"."recorded_at" desc limit $2 params: discarded,60';

afterEach(() => vi.restoreAllMocks());

describe('userFacingError', () => {
  it('hides the query dump that reached a collector', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(userFacingError(new Error(REAL_DUMP), 'Something went wrong')).toBe('Something went wrong');
  });

  it('still logs what it hid, so it is not lost', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    userFacingError(new Error(REAL_DUMP), 'Something went wrong');
    expect(spy).toHaveBeenCalled();
  });

  it('shows the messages that were written to be read', () => {
    const written = [
      'That loan is no longer available',
      'Minimum loan amount is ₹1,000',
      'This loan is already settled',
      'Choose which loan this is for',
      'Payments already exceed the outstanding balance',
      'Already applied or discarded',
    ];
    for (const message of written) {
      expect(userFacingError(new Error(message), 'fallback'), message).toBe(message);
    }
  });

  it('falls back on an empty or missing message', () => {
    expect(userFacingError(new Error(''), 'fallback')).toBe('fallback');
    expect(userFacingError(null, 'fallback')).toBe('fallback');
    expect(userFacingError(undefined, 'fallback')).toBe('fallback');
  });

  it('accepts something thrown that is not an Error', () => {
    expect(userFacingError('plain string problem', 'fallback')).toBe('plain string problem');
  });
});

describe('isInternalError', () => {
  it('catches the database talking', () => {
    const internal = [
      'Failed query: select "loans"."id" from "loans"',
      'relation "collection_entries" does not exist',
      'column "kind" does not exist',
      'syntax error at or near "$1"',
      'duplicate key value violates unique constraint "borrowers_mobile_idx"',
      'insert or update on table "x" violates foreign key constraint',
      'fetch failed',
    ];
    for (const message of internal) expect(isInternalError(message), message).toBe(true);
  });

  it('treats anything sentence-length or longer as a dump', () => {
    // A written message is a sentence. Nothing intentional in this app is close to this.
    expect(isInternalError('x'.repeat(181))).toBe(true);
    expect(isInternalError('x'.repeat(179))).toBe(false);
  });

  it('does not trip on ordinary words that appear in real messages', () => {
    // "update", "select" and "delete" are perfectly normal English; only the quoted-table
    // forms are the giveaway.
    expect(isInternalError('Select a borrower before saving')).toBe(false);
    expect(isInternalError('Could not update the loan notes')).toBe(false);
    expect(isInternalError('Delete this borrower from the Bin?')).toBe(false);
  });
});
