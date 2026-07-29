/**
 * Turns the book into the two tabs.
 *
 * Deliberately pure — every input including "which month is it" arrives as an argument, so
 * the whole shape of the spreadsheet is testable from fixtures with no database, no clock
 * and no network. `sync.ts` is the only place that supplies the real ones.
 *
 * The one structural rule worth stating: the month columns are last on the loans tab, and
 * that is not cosmetic. A new month appends a column; if the detail columns sat to the
 * right of the months, every one of them would shift one place every month, and any formula
 * or filter anyone had built against the sheet would quietly point at the wrong column.
 */
import { type Cell, type Rgb, type Tab, date, empty, formula, money, num, text } from './google';

import type { BorrowerRow, LoanRow, PaymentRow, SheetData } from './data';

/**
 * Which tabs to write into. Passed in rather than read from the environment, so this file
 * stays a pure function of its inputs and the tests can build both tabs without one.
 */
export interface TabNames {
  loans: string;
  borrowers: string;
}

/** A month, as the only two numbers that matter. */
interface Month {
  year: number;
  /** 1–12, not the 0-indexed thing `Date` uses. */
  month: number;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const monthKey = (m: Month) => `${m.year}-${String(m.month).padStart(2, '0')}`;
const monthLabel = (m: Month) => `${MONTH_NAMES[m.month - 1]} ${m.year}`;

/**
 * The month a `date` column falls in, read off the string rather than parsed.
 *
 * `new Date('2024-03-01')` is midnight UTC, which in IST is already the 1st but in any
 * timezone west of UTC is the 28th of February — so a payment recorded on the 1st would be
 * filed under the previous month for anyone whose server ran in the Americas. The column is
 * a plain `YYYY-MM-DD` with no time in it, and slicing it cannot drift.
 */
function monthOfDateString(value: string): Month | null {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

/** Every month from `first` to `last` inclusive. */
function monthRange(first: Month, last: Month): Month[] {
  const months: Month[] = [];
  let { year, month } = first;
  while (year < last.year || (year === last.year && month <= last.month)) {
    months.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

const compareMonths = (a: Month, b: Month) => a.year - b.year || a.month - b.month;

/**
 * The columns the loans tab ends with: the first month anyone paid, through to now.
 *
 * Bounded by the later of today and the last payment on record, because a payment can
 * legitimately carry a future date — someone entering a cheque, or simply mistyping a
 * year — and a column range that stopped at today would drop that money off the sheet
 * entirely rather than showing it somewhere odd where it can be spotted and fixed.
 *
 * With nothing paid yet there is still one column, for the current month. A tab with a
 * header that stops mid-way reads as broken; one empty month column reads as "nothing yet".
 */
export function paymentMonths(payments: PaymentRow[], today: Date): Month[] {
  const current: Month = { year: today.getFullYear(), month: today.getMonth() + 1 };

  const paid = payments
    .filter((p) => p.paidDate && parseFloat(p.amountPaid) > 0)
    .map((p) => monthOfDateString(p.paidDate!))
    .filter((m): m is Month => m !== null);

  if (paid.length === 0) return [current];

  const first = paid.reduce((a, b) => (compareMonths(a, b) <= 0 ? a : b));
  const latest = paid.reduce((a, b) => (compareMonths(a, b) >= 0 ? a : b));
  const last = compareMonths(latest, current) >= 0 ? latest : current;

  return monthRange(first, last);
}

/**
 * Cash received per loan per month.
 *
 * Keyed on the date the money actually arrived, not the instalment it was applied to. A
 * March instalment settled in May belongs in May, because what this tab is — and what the
 * ledger it replaces was — is a record of collections, not a repayment schedule. Which
 * instalment each rupee cleared is on the loan's own screen in the app.
 *
 * Waived instalments contribute nothing here: no money changed hands. They are accounted
 * for in the Waived column instead, so the totals still add up.
 */
export function collectionsByMonth(payments: PaymentRow[]): Map<string, Map<string, number>> {
  const byLoan = new Map<string, Map<string, number>>();

  for (const payment of payments) {
    const amount = parseFloat(payment.amountPaid);
    if (!payment.paidDate || !(amount > 0)) continue;

    const month = monthOfDateString(payment.paidDate);
    if (!month) continue;

    let months = byLoan.get(payment.loanId);
    if (!months) {
      months = new Map();
      byLoan.set(payment.loanId, months);
    }
    const key = monthKey(month);
    months.set(key, (months.get(key) ?? 0) + amount);
  }

  return byLoan;
}

/** What a loan has settled, and how. */
interface LoanTotals {
  paid: number;
  /** Face value of waived instalments — settled without money, so not in `paid`. */
  waived: number;
  outstanding: number;
  instalmentsSettled: number;
  instalments: number;
  lastPaidDate: string | null;
}

export function loanTotals(loan: LoanRow, payments: PaymentRow[]): LoanTotals {
  let paid = 0;
  let waived = 0;
  let instalmentsSettled = 0;
  let lastPaidDate: string | null = null;

  for (const payment of payments) {
    if (payment.status === 'waived') {
      waived += parseFloat(payment.amountDue);
      instalmentsSettled += 1;
      continue;
    }
    const amount = parseFloat(payment.amountPaid);
    paid += amount;
    if (payment.status === 'paid') instalmentsSettled += 1;
    if (payment.paidDate && (!lastPaidDate || payment.paidDate > lastPaidDate)) {
      lastPaidDate = payment.paidDate;
    }
  }

  // Never negative. Overpayment happens — the schedule rolls a surplus forward and the last
  // instalment absorbs whatever is left over — and a negative "outstanding" reads as a
  // mistake in the sheet rather than as change owed back.
  const outstanding = Math.max(0, parseFloat(loan.totalRepayment) - paid - waived);

  return {
    paid,
    waived,
    outstanding,
    instalmentsSettled,
    instalments: payments.length,
    lastPaidDate,
  };
}

// ===================== FORMATTING =====================

/**
 * A string safe to drop inside a formula's double quotes.
 *
 * Doubling quotes is how a spreadsheet escapes them. Without this an address containing a
 * quote mark — 5" plot, a nickname — closes the string early and the whole cell renders as
 * `#ERROR!`, taking a legitimate row with it.
 */
const quote = (value: string) => value.replace(/"/g, '""');

const IST_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * A `date` column — already `YYYY-MM-DD`, with no time and no zone to get wrong.
 *
 * Split off the string rather than parsed. `new Date('2025-09-11')` is midnight UTC, which
 * is still the 10th anywhere west of Greenwich, so a parsed date-given can land a day early
 * on a server that is not in India.
 */
const dateCell = (value: string | null | undefined): Cell => {
  const match = value && /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? date(Number(match[1]), Number(match[2]), Number(match[3])) : empty();
};

/**
 * A timestamp column, taken to the calendar day it fell on in IST — that is where the money
 * is counted, so a loan entered at 1am in Kadapa belongs to that morning, not to the
 * previous evening in UTC.
 */
const istDate = (value: Date | null | undefined): Cell =>
  value ? dateCell(IST_DATE.format(value)) : empty();

const link = (url: string, label: string): Cell =>
  formula(`=HYPERLINK("${quote(url)}","${quote(label)}")`);

// ===================== LOANS TAB =====================

const LOAN_DETAIL_HEADER = [
  '#',
  // Telugu first on both tabs — these are the names the people in the book answer to.
  'Name (Telugu)',
  'Name',
  'Phone',
  'Date given',
  'Given',
  'Principal',
  'Profit',
  'Paid',
];

/**
 * Status is a row colour rather than a column.
 *
 * Green for a loan that is finished, so a page of them reads at a glance. Defaulted gets
 * its own colour rather than being left plain: dropping the column removed the only place
 * that fact appeared, and a written-off loan sitting visually identical to a live one is
 * the one confusion this tab must not create. Active and extended stay uncoloured — they
 * are the normal case, and colouring everything would say nothing.
 */
const STATUS_ROW_COLOUR: Record<string, Rgb | undefined> = {
  completed: { red: 0.851, green: 0.918, blue: 0.827 },
  defaulted: { red: 0.957, green: 0.8, blue: 0.8 },
};

export function buildLoansTab(data: SheetData, today: Date, name = 'loans'): Tab {
  const months = paymentMonths(data.payments, today);
  const collections = collectionsByMonth(data.payments);

  const borrowersById = new Map(data.borrowers.map((b) => [b.id, b]));
  const paymentsByLoan = new Map<string, PaymentRow[]>();
  for (const payment of data.payments) {
    const list = paymentsByLoan.get(payment.loanId);
    if (list) list.push(payment);
    else paymentsByLoan.set(payment.loanId, [payment]);
  }

  const rowBackgrounds: Array<Rgb | null> = [];

  const rows = data.loans.map((loan) => {
    const borrower = borrowersById.get(loan.borrowerId);
    const totals = loanTotals(loan, paymentsByLoan.get(loan.id) ?? []);
    const received = collections.get(loan.id);

    rowBackgrounds.push(STATUS_ROW_COLOUR[loan.status] ?? null);

    const detail: Cell[] = [
      num(loan.loanNumber),
      text(borrower?.nameTelugu),
      text(borrower?.name),
      // Text, always. As a number a mobile loses the leading zeros the legacy import used
      // for the borrowers who had no phone on file, and gains a thousands separator.
      text(borrower?.mobile),
      dateCell(loan.dateGiven),
      money(parseFloat(loan.amountUserReceived)),
      money(parseFloat(loan.primaryAmount)),
      money(parseFloat(loan.profitAmount)),
      money(totals.paid),
    ];

    // Left blank rather than zeroed. A month with no collection and a month where exactly
    // nothing was expected look identical once both are `0`, and the blanks are what make
    // a gap in someone's payments visible at a glance across the row.
    const monthCells = months.map((month) => {
      const amount = received?.get(monthKey(month));
      return amount ? money(amount) : empty();
    });

    return [...detail, ...monthCells];
  });

  return {
    name,
    header: [...LOAN_DETAIL_HEADER, ...months.map(monthLabel)],
    rows,
    rowBackgrounds,
    // Serial and both names stay put while the months scroll past. Freezing through the
    // English name as well as the Telugu one is what makes the right-hand end of this tab
    // readable — by the time you reach 2026 the row is otherwise anonymous.
    frozenColumns: 3,
  };
}

// ===================== BORROWERS TAB =====================

const BORROWER_HEADER = [
  '#',
  'Loans',
  // Telugu first on this tab: it is the borrower register, and these are the names the
  // people in it actually answer to. The loans tab keeps English first — it is read
  // alongside the money.
  'Name (Telugu)',
  'Name',
  'Phone',
  'Area',
  'Address',
  'Location',
  'Surety type',
  'Surety',
  'Photo',
  'Photo link',
  'Aadhaar',
  'Portal link',
  'Loan count',
  'Given',
  'Total repayable',
  'Paid',
  'Outstanding',
  'Created by',
  'Created at',
];

export function buildBorrowersTab(data: SheetData, appUrl: string, name = 'borrowers'): Tab {
  const paymentsByLoan = new Map<string, PaymentRow[]>();
  for (const payment of data.payments) {
    const list = paymentsByLoan.get(payment.loanId);
    if (list) list.push(payment);
    else paymentsByLoan.set(payment.loanId, [payment]);
  }

  const loansByBorrower = new Map<string, LoanRow[]>();
  for (const loan of data.loans) {
    const list = loansByBorrower.get(loan.borrowerId);
    if (list) list.push(loan);
    else loansByBorrower.set(loan.borrowerId, [loan]);
  }

  const namesById = new Map(data.borrowers.map((b) => [b.id, b.name]));

  const rows = data.borrowers.map((borrower, index) => {
    const theirLoans = loansByBorrower.get(borrower.id) ?? [];

    let given = 0;
    let repayable = 0;
    let paid = 0;
    let outstanding = 0;
    for (const loan of theirLoans) {
      const totals = loanTotals(loan, paymentsByLoan.get(loan.id) ?? []);
      given += parseFloat(loan.amountUserReceived);
      repayable += parseFloat(loan.totalRepayment);
      paid += totals.paid;
      outstanding += totals.outstanding;
    }

    return [
      // A row number, not an identifier. Borrowers have no serial in the app, and inventing
      // a stable one here would be inventing a fact about the business — this column is
      // there to count rows and nothing more.
      num(index + 1),
      // The loan numbers shown in the app, so a row here can be matched to rows on the
      // loans tab by eye. Not the UUIDs: unreadable, and nothing on this tab needs them.
      text(theirLoans.map((loan) => loan.loanNumber).join(', ')),
      text(borrower.nameTelugu),
      text(borrower.name),
      text(borrower.mobile),
      text(borrower.area),
      text(borrower.address),
      mapLink(borrower),
      text(borrower.suretyType),
      text(borrower.suretyReferenceId ? namesById.get(borrower.suretyReferenceId) : null),
      photoPreview(borrower.profilePhotoUrl),
      borrower.profilePhotoUrl ? link(borrower.profilePhotoUrl, 'Photo') : empty(),
      // A link, never an image. Rendering identity documents as thumbnails puts a wall of
      // scanned Aadhaar cards on screen for anyone who opens the file, including over
      // someone's shoulder — one deliberate click to see one is the right friction.
      borrower.aadhaarPhotoUrl ? link(borrower.aadhaarPhotoUrl, 'Aadhaar') : empty(),
      link(`${appUrl}/portal/${borrower.portalToken}`, 'Portal'),
      num(theirLoans.length),
      money(given),
      money(repayable),
      money(paid),
      money(outstanding),
      text(borrower.createdByName),
      istDate(borrower.createdAt),
    ];
  });

  // Through both names again — one further right than the loans tab, because the loan
  // numbers sit between the serial and the names here.
  return { name, header: BORROWER_HEADER, rows, frozenColumns: 4 };
}

/**
 * `=IMAGE` with mode 4 and an explicit height, rather than the default fit-to-cell. Left to
 * itself a photo stretches to whatever the row happens to be, so a tab of portraits comes
 * out at wildly different sizes; pinning the height makes the column scan as a column.
 */
function photoPreview(url: string | null): Cell {
  if (!url) return empty();
  return formula(`=IMAGE("${quote(url)}",4,90,90)`);
}

function mapLink(borrower: BorrowerRow): Cell {
  if (!borrower.locationLat || !borrower.locationLng) return empty();
  const lat = borrower.locationLat;
  const lng = borrower.locationLng;
  return link(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, `${lat}, ${lng}`);
}

export function buildTabs(data: SheetData, today: Date, appUrl: string, names: TabNames): Tab[] {
  return [
    buildLoansTab(data, today, names.loans),
    buildBorrowersTab(data, appUrl, names.borrowers),
  ];
}
