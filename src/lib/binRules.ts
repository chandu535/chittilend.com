/**
 * When a loan or a borrower may be binned, restored, or destroyed.
 *
 * These functions **explain**; they do not enforce. Every rule here is also written into
 * the WHERE clause of the statement that performs the change, so the decision and the
 * write happen at the same instant and there is no window between checking and acting.
 * What this file is for is saying *why* something was refused — the server turns a
 * zero-row result into a reason, and the UI greys a button and shows the same one.
 *
 * Keeping it pure, with no database and no React, is what lets both sides run identical
 * logic and lets the whole rule set be tested on plain objects.
 */

export type LoanStatus = 'active' | 'completed' | 'defaulted' | 'extended';

/** Every way a bin, restore or purge can be refused. */
export const BIN_REASONS = {
  LOAN_NOT_FOUND: 'LOAN_NOT_FOUND',
  /** Active or extended — money is still owed on it. */
  LOAN_STILL_OWING: 'LOAN_STILL_OWING',
  LOAN_ALREADY_BINNED: 'LOAN_ALREADY_BINNED',
  LOAN_NOT_BINNED: 'LOAN_NOT_BINNED',
  BORROWER_NOT_FOUND: 'BORROWER_NOT_FOUND',
  /** Bin their loans first — a loan must never outlive its borrower. */
  BORROWER_HAS_LIVE_LOANS: 'BORROWER_HAS_LIVE_LOANS',
  /** Purge only: even binned loans hold a borrower in place. */
  BORROWER_HAS_ANY_LOANS: 'BORROWER_HAS_ANY_LOANS',
  BORROWER_ALREADY_BINNED: 'BORROWER_ALREADY_BINNED',
  BORROWER_NOT_BINNED: 'BORROWER_NOT_BINNED',
  /** Someone else now holds their mobile number. */
  BORROWER_MOBILE_TAKEN: 'BORROWER_MOBILE_TAKEN',
} as const;

export type BinReason = (typeof BIN_REASONS)[keyof typeof BIN_REASONS];

export interface RefusalDetail {
  /** The borrower now holding the mobile, for BORROWER_MOBILE_TAKEN. */
  name?: string;
  /** How many loans are in the way, for the two HAS_*_LOANS reasons. */
  count?: number;
  // Passed straight to i18next as interpolation values, which wants an index signature.
  [key: string]: unknown;
}

export type Decision =
  | {
    allowed: true;
    /** Restoring this loan pulls its binned borrower back with it. */
    alsoRestoresBorrower?: boolean;
  }
  | { allowed: false; reason: BinReason; detail?: RefusalDetail };

export interface LoanFacts {
  status: LoanStatus;
  deleted: boolean;
}

export interface BorrowerFacts {
  deleted: boolean;
  /** Loans not in the bin. */
  liveLoanCount: number;
  /** Every loan they have ever had that still exists as a row, binned included. */
  totalLoanCount: number;
  /** A different, live borrower already on this mobile. Null when it is free. */
  mobileHolder: { id: string; name: string } | null;
}

const ALLOWED: Decision = { allowed: true };

const refuse = (reason: BinReason, detail?: RefusalDetail): Decision => ({
  allowed: false,
  reason,
  ...(detail ? { detail } : {}),
});

/**
 * A loan can go to the bin unless money is still owed on it.
 *
 * `completed` and `defaulted` are finished business and may be cleaned up — which is what
 * makes a duplicate borrower record removable at all. `active` and `extended` are live
 * debts, and hiding one would take real money off the books.
 */
export function canBinLoan(loan: LoanFacts): Decision {
  if (loan.deleted) return refuse(BIN_REASONS.LOAN_ALREADY_BINNED);
  if (loan.status === 'active' || loan.status === 'extended') {
    return refuse(BIN_REASONS.LOAN_STILL_OWING);
  }
  return ALLOWED;
}

/**
 * A borrower can go to the bin only once none of their loans are left in the lists.
 *
 * The alternative — cascading — would let one tap remove an unbounded amount of history,
 * and would have to override the rule above to do it. Making it two deliberate steps keeps
 * every removal something the admin chose, and guarantees no loan is ever left pointing at
 * a borrower who is not there.
 */
export function canBinBorrower(borrower: BorrowerFacts): Decision {
  if (borrower.deleted) return refuse(BIN_REASONS.BORROWER_ALREADY_BINNED);
  if (borrower.liveLoanCount > 0) {
    return refuse(BIN_REASONS.BORROWER_HAS_LIVE_LOANS, { count: borrower.liveLoanCount });
  }
  return ALLOWED;
}

/**
 * Restoring a loan brings its borrower back too, when the borrower is also binned.
 *
 * Which means a loan restore inherits the borrower's constraint: if someone else has taken
 * that mobile number in the meantime, neither can come back until the conflict is settled.
 * Refusing both is the only honest answer — restoring the loan alone would leave it
 * pointing at nobody.
 */
export function canRestoreLoan(loan: LoanFacts, borrower: BorrowerFacts): Decision {
  if (!loan.deleted) return refuse(BIN_REASONS.LOAN_NOT_BINNED);
  if (!borrower.deleted) return ALLOWED;

  if (borrower.mobileHolder) {
    return refuse(BIN_REASONS.BORROWER_MOBILE_TAKEN, { name: borrower.mobileHolder.name });
  }
  return { allowed: true, alsoRestoresBorrower: true };
}

/**
 * A borrower can come back only if their mobile number is still theirs.
 *
 * Mobile is the identity key in this operation, and the database enforces one live
 * borrower per number. Restoring into an occupied number would either fail at the index or
 * quietly create the duplicate the whole scheme exists to prevent.
 */
export function canRestoreBorrower(borrower: BorrowerFacts): Decision {
  if (!borrower.deleted) return refuse(BIN_REASONS.BORROWER_NOT_BINNED);
  if (borrower.mobileHolder) {
    return refuse(BIN_REASONS.BORROWER_MOBILE_TAKEN, { name: borrower.mobileHolder.name });
  }
  return ALLOWED;
}

/** Destroying a loan for good. Only from the bin — never straight from the list. */
export function canPurgeLoan(loan: LoanFacts): Decision {
  if (!loan.deleted) return refuse(BIN_REASONS.LOAN_NOT_BINNED);
  return ALLOWED;
}

/**
 * Destroying a borrower for good, which is stricter than binning them: even their binned
 * loans hold them in place. Those loans would otherwise be left pointing at nothing, and
 * unlike a bin that state is not recoverable.
 */
export function canPurgeBorrower(borrower: BorrowerFacts): Decision {
  if (!borrower.deleted) return refuse(BIN_REASONS.BORROWER_NOT_BINNED);
  if (borrower.totalLoanCount > 0) {
    return refuse(BIN_REASONS.BORROWER_HAS_ANY_LOANS, { count: borrower.totalLoanCount });
  }
  return ALLOWED;
}

/**
 * The translation key for a refusal — derived, so the server and the UI cannot drift onto
 * different wordings for the same reason. `LOAN_STILL_OWING` becomes `bin.errLoanStillOwing`.
 */
export function binReasonKey(reason: BinReason): string {
  const camel = reason
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
  return `bin.err${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
}

/**
 * Packs a refusal into the string thrown across the wire, since a server function can only
 * reject with an Error. The name travels after a colon so the message can say who is
 * holding the mobile rather than just that someone is.
 */
export function encodeRefusal(reason: BinReason, detail?: RefusalDetail): string {
  const suffix = detail?.name ?? (detail?.count !== undefined ? String(detail.count) : '');
  return suffix ? `${reason}:${suffix}` : reason;
}

/** Reads back what `encodeRefusal` wrote. Returns null for anything not a bin refusal. */
export function decodeRefusal(
  message: string,
): { reason: BinReason; detail: RefusalDetail } | null {
  const [head, ...rest] = message.split(':');
  if (!(head in BIN_REASONS)) return null;

  const suffix = rest.join(':');
  const asCount = Number(suffix);
  return {
    reason: head as BinReason,
    detail: suffix === ''
      ? {}
      : Number.isInteger(asCount) ? { count: asCount } : { name: suffix },
  };
}
