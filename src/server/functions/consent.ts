import { createServerFn } from '@tanstack/react-start';
import { getRequestIP, getRequestHeader } from '@tanstack/react-start/server';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { borrowers, loans } from '../db/schema';
import { getAuthenticatedUser } from '../middleware/auth';
import { requirePermission } from '../middleware/roleGuard';

function validateToken(data: unknown): { token: string } {
  const token = (data as { token?: string }).token;
  if (!token || !/^[0-9a-f]{64}$/.test(token)) throw new Error('Invalid or expired link');
  return { token };
}

/**
 * Loan terms shown on the acceptance page, looked up by consent token alone.
 * Unauthenticated by design — the token is the credential, so it deliberately
 * exposes only this one loan and nothing else about the borrower.
 */
export const getLoanForConsent = createServerFn({ method: 'GET' })
  .inputValidator(validateToken)
  .handler(async ({ data }) => {
    const [row] = await db
      .select({
        loanNumber: loans.loanNumber,
        primaryAmount: loans.primaryAmount,
        amountUserReceived: loans.amountUserReceived,
        totalRepayment: loans.totalRepayment,
        installmentAmount: loans.installmentAmount,
        totalInstallments: loans.totalInstallments,
        paymentFrequency: loans.paymentFrequency,
        status: loans.status,
        consentTokenExpiry: loans.consentTokenExpiry,
        borrowerAcceptedAt: loans.borrowerAcceptedAt,
        borrowerName: borrowers.name,
        borrowerNameTelugu: borrowers.nameTelugu,
      })
      .from(loans)
      .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
      .where(eq(loans.consentToken, data.token))
      .limit(1);

    if (!row) throw new Error('Invalid or expired link');
    if (row.consentTokenExpiry && new Date(row.consentTokenExpiry) < new Date()) {
      throw new Error('This link has expired. Please ask for a new one.');
    }

    const { consentTokenExpiry: _expiry, ...loan } = row;
    return loan;
  });

/**
 * Records the borrower's acceptance.
 *
 * Unauthenticated on purpose: the consent token identifies exactly one loan, so there is
 * no id to tamper with and no way to reach another borrower's record. Acceptance is
 * write-once — re-tapping returns the original timestamp rather than overwriting it, so
 * the recorded date stays trustworthy.
 */
export const acceptLoanAsBorrower = createServerFn({ method: 'POST' })
  .inputValidator(validateToken)
  .handler(async ({ data }) => {
    const [loan] = await db
      .select({
        id: loans.id,
        borrowerAcceptedAt: loans.borrowerAcceptedAt,
        consentTokenExpiry: loans.consentTokenExpiry,
      })
      .from(loans)
      .where(eq(loans.consentToken, data.token))
      .limit(1);

    if (!loan) throw new Error('Invalid or expired link');
    if (loan.consentTokenExpiry && new Date(loan.consentTokenExpiry) < new Date()) {
      throw new Error('This link has expired. Please ask for a new one.');
    }
    if (loan.borrowerAcceptedAt) {
      return { acceptedAt: loan.borrowerAcceptedAt, alreadyAccepted: true };
    }

    const acceptedAt = new Date();
    await db
      .update(loans)
      .set({
        borrowerAcceptedAt: acceptedAt,
        borrowerAcceptanceIp: getRequestIP({ xForwardedFor: true })?.slice(0, 64) ?? null,
        borrowerAcceptanceUserAgent: getRequestHeader('user-agent') ?? null,
        updatedAt: acceptedAt,
      })
      .where(eq(loans.id, loan.id));

    return { acceptedAt, alreadyAccepted: false };
  });

/** Records the lender's side of the same agreement. */
export const acceptLoanAsOwner = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const loanId = (data as { loanId?: string }).loanId;
    if (!loanId) throw new Error('Loan ID is required');
    return { loanId };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'loans.write');

    const [loan] = await db
      .select({ id: loans.id, ownerAcceptedAt: loans.ownerAcceptedAt })
      .from(loans)
      .where(eq(loans.id, data.loanId))
      .limit(1);

    if (!loan) throw new Error('Loan not found');
    if (loan.ownerAcceptedAt) {
      return { acceptedAt: loan.ownerAcceptedAt, alreadyAccepted: true };
    }

    const acceptedAt = new Date();
    await db
      .update(loans)
      .set({ ownerAcceptedAt: acceptedAt, ownerAcceptedBy: user.id, updatedAt: acceptedAt })
      .where(eq(loans.id, loan.id));

    return { acceptedAt, alreadyAccepted: false };
  });
