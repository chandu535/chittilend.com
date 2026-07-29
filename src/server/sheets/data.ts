/**
 * Everything the mirror needs, in three queries.
 *
 * A full rebuild wants the whole book at once, so this reads it whole rather than paging.
 * At the size this app is built for — a few hundred borrowers, a few thousand instalments —
 * that is one round trip each and a couple of megabytes, and it keeps the aggregation in
 * plain TypeScript where it can be unit tested against fixtures instead of a database.
 *
 * Binned rows never leave here. That is not a display choice: a spreadsheet is downloaded,
 * mailed and kept, so a borrower who was removed from the app reappearing in a file on
 * someone's laptop is the one leak that cannot be undone. The queries below are covered by
 * the mechanical guard in `db/softDelete.test.ts` for exactly that reason.
 */
import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { borrowers, loans, payments, users } from '../db/schema';
import { borrowerLive, loanLive } from '../db/softDelete';

export interface LoanRow {
  id: string;
  loanNumber: number;
  borrowerId: string;
  dateGiven: string;
  startMonth: string;
  primaryAmount: string;
  serviceChargePercent: string;
  serviceChargeAmount: string;
  amountUserReceived: string;
  markupPercent: string;
  totalRepayment: string;
  profitAmount: string;
  tenureMonths: number;
  paymentFrequency: string;
  installmentAmount: string;
  totalInstallments: number;
  status: string;
  notes: string | null;
  welcomeSentAt: Date | null;
  borrowerAcceptedAt: Date | null;
  ownerAcceptedAt: Date | null;
  createdAt: Date;
  createdByName: string | null;
}

export interface BorrowerRow {
  id: string;
  name: string;
  nameTelugu: string | null;
  mobile: string;
  area: string | null;
  address: string | null;
  locationLat: string | null;
  locationLng: string | null;
  aadhaarPhotoUrl: string | null;
  profilePhotoUrl: string | null;
  suretyType: string | null;
  suretyReferenceId: string | null;
  portalToken: string;
  createdAt: Date;
  createdByName: string | null;
}

export interface PaymentRow {
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: string;
  amountPaid: string;
  paidDate: string | null;
  status: string;
  paymentMethod: string | null;
}

export interface SheetData {
  loans: LoanRow[];
  borrowers: BorrowerRow[];
  payments: PaymentRow[];
}

export async function readSheetData(): Promise<SheetData> {
  // A left join on users: `created_by` is NOT NULL, but the row it names is not guaranteed
  // to survive for ever, and an inner join would silently drop a whole loan from the
  // spreadsheet to avoid admitting it does not know who entered it.
  const loanRows = await db
    .select({
      id: loans.id,
      loanNumber: loans.loanNumber,
      borrowerId: loans.borrowerId,
      dateGiven: loans.dateGiven,
      startMonth: loans.startMonth,
      primaryAmount: loans.primaryAmount,
      serviceChargePercent: loans.serviceChargePercent,
      serviceChargeAmount: loans.serviceChargeAmount,
      amountUserReceived: loans.amountUserReceived,
      markupPercent: loans.markupPercent,
      totalRepayment: loans.totalRepayment,
      profitAmount: loans.profitAmount,
      tenureMonths: loans.tenureMonths,
      paymentFrequency: loans.paymentFrequency,
      installmentAmount: loans.installmentAmount,
      totalInstallments: loans.totalInstallments,
      status: loans.status,
      notes: loans.notes,
      welcomeSentAt: loans.welcomeSentAt,
      borrowerAcceptedAt: loans.borrowerAcceptedAt,
      ownerAcceptedAt: loans.ownerAcceptedAt,
      createdAt: loans.createdAt,
      createdByName: users.name,
    })
    .from(loans)
    .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
    .leftJoin(users, eq(loans.createdBy, users.id))
    // Both sides: a loan whose borrower is binned has no row on either tab, so the loans
    // tab can never name someone the borrowers tab does not list.
    .where(and(loanLive, borrowerLive))
    .orderBy(asc(loans.loanNumber));

  const borrowerRows = await db
    .select({
      id: borrowers.id,
      name: borrowers.name,
      nameTelugu: borrowers.nameTelugu,
      mobile: borrowers.mobile,
      area: borrowers.area,
      address: borrowers.address,
      locationLat: borrowers.locationLat,
      locationLng: borrowers.locationLng,
      aadhaarPhotoUrl: borrowers.aadhaarPhotoUrl,
      profilePhotoUrl: borrowers.profilePhotoUrl,
      suretyType: borrowers.suretyType,
      suretyReferenceId: borrowers.suretyReferenceId,
      portalToken: borrowers.portalToken,
      createdAt: borrowers.createdAt,
      createdByName: users.name,
    })
    .from(borrowers)
    .leftJoin(users, eq(borrowers.createdBy, users.id))
    .where(borrowerLive)
    .orderBy(asc(borrowers.createdAt));

  // Narrowed through the loan rather than filtered afterwards, so an instalment belonging
  // to a binned loan is never even fetched — the month columns are built from this list and
  // would otherwise show money against a loan that has no row.
  const paymentRows = await db
    .select({
      loanId: payments.loanId,
      installmentNumber: payments.installmentNumber,
      dueDate: payments.dueDate,
      amountDue: payments.amountDue,
      amountPaid: payments.amountPaid,
      paidDate: payments.paidDate,
      status: payments.status,
      paymentMethod: payments.paymentMethod,
    })
    .from(payments)
    .innerJoin(loans, eq(payments.loanId, loans.id))
    .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
    .where(and(isNull(loans.deletedAt), isNull(borrowers.deletedAt)))
    .orderBy(asc(payments.loanId), asc(payments.installmentNumber));

  return { loans: loanRows, borrowers: borrowerRows, payments: paymentRows };
}
