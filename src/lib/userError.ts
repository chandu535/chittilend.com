/**
 * Decides whether an error is fit to put in front of a person.
 *
 * Server functions throw two very different things through the same channel. Some messages
 * are written for the reader — "That loan is no longer available", "Minimum loan amount is
 * ₹1,000" — and showing them is the whole point. Others are the database talking: a missing
 * table produced a toast containing the entire SELECT, column list and all, on the one
 * screen in this app designed for somebody who cannot read it.
 *
 * There is no flag distinguishing the two by the time it reaches the browser, so this reads
 * the shape of the message. That is a heuristic and it is deliberately biased: an internal
 * message wrongly shown is a screenful of SQL, while a written one wrongly hidden is a
 * generic sentence that still tells the person something went wrong.
 */

/** Markers that only ever appear in a driver or query-builder error. */
const INTERNAL = [
  /failed query/i,
  /relation "[^"]*" does not exist/i,
  /column "[^"]*" does not exist/i,
  /syntax error at or near/i,
  /violates (foreign key|not-null|unique) constraint/i,
  /duplicate key value/i,
  /\bselect\s+"/i,
  /\b(insert into|update|delete from)\s+"/i,
  /neondberror/i,
  /econnrefused|etimedout|fetch failed/i,
];

/**
 * A written message is a sentence. Anything this long is a dump, whatever it matched —
 * the SQL in question ran to nine hundred characters.
 */
const MAX_SHOWN = 180;

export function isInternalError(message: string): boolean {
  if (message.length > MAX_SHOWN) return true;
  return INTERNAL.some((pattern) => pattern.test(message));
}

/**
 * The message to show, given whatever was thrown and a fallback for when it is not fit
 * to show. The original is logged either way, so hiding it from the screen does not hide
 * it from whoever has to work out what happened.
 */
export function userFacingError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (!message.trim()) return fallback;
  if (!isInternalError(message)) return message;

  console.error('[error]', error);
  return fallback;
}
