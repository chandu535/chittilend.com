import { describe, it, expect } from 'vitest';
import {
  BIN_REASONS,
  binReasonKey,
  canBinBorrower,
  canBinLoan,
  canPurgeBorrower,
  canPurgeLoan,
  canRestoreBorrower,
  canRestoreLoan,
  decodeRefusal,
  encodeRefusal,
  type BorrowerFacts,
  type LoanFacts,
  type LoanStatus,
} from './binRules';

const loan = (over: Partial<LoanFacts> = {}): LoanFacts => ({
  status: 'completed',
  deleted: false,
  ...over,
});

const borrower = (over: Partial<BorrowerFacts> = {}): BorrowerFacts => ({
  deleted: false,
  liveLoanCount: 0,
  totalLoanCount: 0,
  mobileHolder: null,
  ...over,
});

/** Narrows to the refusal arm so the reason can be read without a cast in every test. */
const refusal = (decision: ReturnType<typeof canBinLoan>) => {
  if (decision.allowed) throw new Error('expected a refusal, got allowed');
  return decision;
};

describe('canBinLoan', () => {
  const cases: Array<[LoanStatus, boolean]> = [
    ['active', false],
    ['extended', false],
    ['completed', true],
    ['defaulted', true],
  ];

  it.each(cases)('%s -> %s', (status, allowed) => {
    expect(canBinLoan(loan({ status })).allowed).toBe(allowed);
  });

  it('refuses a live loan because money is still owed', () => {
    // Not a generic "not allowed" — the message sends someone to settle or default it.
    expect(refusal(canBinLoan(loan({ status: 'active' }))).reason)
      .toBe(BIN_REASONS.LOAN_STILL_OWING);
  });

  it('refuses one that is already in the bin', () => {
    expect(refusal(canBinLoan(loan({ deleted: true }))).reason)
      .toBe(BIN_REASONS.LOAN_ALREADY_BINNED);
  });

  it('checks the bin before the status, so a binned live loan reads as already binned', () => {
    // Impossible through the app, but the order decides which of two true things is said.
    expect(refusal(canBinLoan(loan({ status: 'active', deleted: true }))).reason)
      .toBe(BIN_REASONS.LOAN_ALREADY_BINNED);
  });
});

describe('canBinBorrower', () => {
  it('allows one whose loans are all in the bin already', () => {
    expect(canBinBorrower(borrower({ liveLoanCount: 0, totalLoanCount: 3 })).allowed).toBe(true);
  });

  it('allows one with no loans at all', () => {
    expect(canBinBorrower(borrower()).allowed).toBe(true);
  });

  it('refuses while any loan is still in the lists, and says how many', () => {
    // The count is what makes the message actionable: "bin their 2 loans first".
    const decision = refusal(canBinBorrower(borrower({ liveLoanCount: 2, totalLoanCount: 5 })));
    expect(decision.reason).toBe(BIN_REASONS.BORROWER_HAS_LIVE_LOANS);
    expect(decision.detail?.count).toBe(2);
  });

  it('refuses one already in the bin', () => {
    expect(refusal(canBinBorrower(borrower({ deleted: true }))).reason)
      .toBe(BIN_REASONS.BORROWER_ALREADY_BINNED);
  });
});

describe('canRestoreLoan', () => {
  it('restores the loan alone when its borrower was never binned', () => {
    const decision = canRestoreLoan(loan({ deleted: true }), borrower());
    expect(decision).toEqual({ allowed: true });
  });

  it('flags that a binned borrower comes back with it', () => {
    // The confirm dialog reads this: the cascade has to be stated before it happens.
    const decision = canRestoreLoan(loan({ deleted: true }), borrower({ deleted: true }));
    expect(decision).toEqual({ allowed: true, alsoRestoresBorrower: true });
  });

  it('refuses when the borrower cannot come back, naming who holds the mobile', () => {
    // Restoring the loan alone would leave it pointing at a borrower who is not there.
    const decision = refusal(canRestoreLoan(
      loan({ deleted: true }),
      borrower({ deleted: true, mobileHolder: { id: 'b2', name: 'Nagaraju' } }),
    ));
    expect(decision.reason).toBe(BIN_REASONS.BORROWER_MOBILE_TAKEN);
    expect(decision.detail?.name).toBe('Nagaraju');
  });

  it('ignores a mobile conflict when the borrower is live', () => {
    // A live borrower already owns their number; a "holder" here is themselves at most.
    const decision = canRestoreLoan(
      loan({ deleted: true }),
      borrower({ deleted: false, mobileHolder: { id: 'b2', name: 'Nagaraju' } }),
    );
    expect(decision.allowed).toBe(true);
  });

  it('refuses a loan that is not in the bin', () => {
    expect(refusal(canRestoreLoan(loan({ deleted: false }), borrower())).reason)
      .toBe(BIN_REASONS.LOAN_NOT_BINNED);
  });
});

describe('canRestoreBorrower', () => {
  it('allows one whose number is still free', () => {
    expect(canRestoreBorrower(borrower({ deleted: true })).allowed).toBe(true);
  });

  it('refuses when someone else took the number, and names them', () => {
    const decision = refusal(canRestoreBorrower(borrower({
      deleted: true,
      mobileHolder: { id: 'b2', name: 'Venkata Rao' },
    })));
    expect(decision.reason).toBe(BIN_REASONS.BORROWER_MOBILE_TAKEN);
    expect(decision.detail?.name).toBe('Venkata Rao');
  });

  it('refuses one that is not in the bin', () => {
    expect(refusal(canRestoreBorrower(borrower({ deleted: false }))).reason)
      .toBe(BIN_REASONS.BORROWER_NOT_BINNED);
  });
});

describe('canPurgeLoan', () => {
  it('allows one sitting in the bin, whatever its status', () => {
    expect(canPurgeLoan(loan({ deleted: true, status: 'defaulted' })).allowed).toBe(true);
  });

  it('refuses one still in the lists — purging is only ever reached through the bin', () => {
    expect(refusal(canPurgeLoan(loan({ deleted: false }))).reason)
      .toBe(BIN_REASONS.LOAN_NOT_BINNED);
  });
});

describe('canPurgeBorrower', () => {
  it('allows one in the bin with no loans left at all', () => {
    expect(canPurgeBorrower(borrower({ deleted: true })).allowed).toBe(true);
  });

  it('refuses while a binned loan still points at them', () => {
    // Stricter than binning on purpose: this one cannot be undone, and the loan would be
    // left pointing at nothing.
    const decision = refusal(canPurgeBorrower(borrower({
      deleted: true, liveLoanCount: 0, totalLoanCount: 2,
    })));
    expect(decision.reason).toBe(BIN_REASONS.BORROWER_HAS_ANY_LOANS);
    expect(decision.detail?.count).toBe(2);
  });

  it('refuses one that is not in the bin', () => {
    expect(refusal(canPurgeBorrower(borrower({ deleted: false }))).reason)
      .toBe(BIN_REASONS.BORROWER_NOT_BINNED);
  });
});

describe('binReasonKey', () => {
  it('derives the key rather than mapping it, so the two cannot drift', () => {
    expect(binReasonKey(BIN_REASONS.LOAN_STILL_OWING)).toBe('bin.errLoanStillOwing');
    expect(binReasonKey(BIN_REASONS.BORROWER_MOBILE_TAKEN)).toBe('bin.errBorrowerMobileTaken');
    expect(binReasonKey(BIN_REASONS.BORROWER_HAS_ANY_LOANS)).toBe('bin.errBorrowerHasAnyLoans');
  });

  it('produces a distinct key for every reason', () => {
    const keys = Object.values(BIN_REASONS).map(binReasonKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('refusal encoding', () => {
  it('carries a name through the wire', () => {
    const wire = encodeRefusal(BIN_REASONS.BORROWER_MOBILE_TAKEN, { name: 'Nagaraju' });
    expect(wire).toBe('BORROWER_MOBILE_TAKEN:Nagaraju');
    expect(decodeRefusal(wire)).toEqual({
      reason: BIN_REASONS.BORROWER_MOBILE_TAKEN,
      detail: { name: 'Nagaraju' },
    });
  });

  it('carries a count through the wire', () => {
    const wire = encodeRefusal(BIN_REASONS.BORROWER_HAS_LIVE_LOANS, { count: 3 });
    expect(decodeRefusal(wire)).toEqual({
      reason: BIN_REASONS.BORROWER_HAS_LIVE_LOANS,
      detail: { count: 3 },
    });
  });

  it('survives a name containing a colon', () => {
    // Rejoined rather than taking the second segment, or a name would be truncated.
    expect(decodeRefusal('BORROWER_MOBILE_TAKEN:Rama: Krishna')?.detail.name)
      .toBe('Rama: Krishna');
  });

  it('round-trips a reason with no detail', () => {
    expect(decodeRefusal(encodeRefusal(BIN_REASONS.LOAN_STILL_OWING)))
      .toEqual({ reason: BIN_REASONS.LOAN_STILL_OWING, detail: {} });
  });

  it('returns null for anything that is not a bin refusal', () => {
    // The UI falls back to the generic error message rather than showing a raw string.
    expect(decodeRefusal('Insufficient permissions for bin.write.')).toBeNull();
    expect(decodeRefusal('')).toBeNull();
  });
});
