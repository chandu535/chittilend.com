import { ilike, or, type SQL } from 'drizzle-orm';
import { borrowers } from './schema';

/**
 * What "search" means when you type into any list in this app.
 *
 * It has to be one rule. The loans list matched only `name` while the borrowers list
 * matched the Telugu spelling and the mobile number too, so the same text found a person
 * on one screen and nothing on the other — a borrower stored as "Venkata Rao" was found
 * by "వెంకట" under Borrowers and by nothing at all under Loans. That reads as the app
 * losing data rather than as two queries disagreeing.
 *
 * All three fields matter here. Names are entered in English and displayed in Telugu, so
 * whichever one is on screen is the one someone will type; and a mobile number is often
 * the only thing that separates two people with the same name.
 */
export function borrowerSearchCondition(term: string): SQL | undefined {
  const trimmed = term.trim();
  if (!trimmed) return undefined;

  const pattern = `%${trimmed}%`;
  return or(
    ilike(borrowers.name, pattern),
    ilike(borrowers.nameTelugu, pattern),
    ilike(borrowers.mobile, pattern),
  );
}
