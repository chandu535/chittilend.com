import { describe, it, expect } from 'vitest';
import { buildBorrowersTab, buildLoansTab, collectionsByMonth, loanTotals, paymentMonths } from './grid';
import { date } from './google';
import type { BorrowerRow, LoanRow, PaymentRow, SheetData } from './data';

const borrower = (over: Partial<BorrowerRow> = {}): BorrowerRow => ({
  id: 'b1',
  name: 'Ravi Kumar',
  nameTelugu: 'రవి కుమార్',
  mobile: '9876543210',
  area: 'Kadapa',
  address: null,
  locationLat: null,
  locationLng: null,
  aadhaarPhotoUrl: null,
  profilePhotoUrl: null,
  suretyType: 'owner',
  suretyReferenceId: null,
  portalToken: 'tok',
  createdAt: new Date('2024-02-01T05:00:00Z'),
  createdByName: 'Sai',
  ...over,
});

const loan = (over: Partial<LoanRow> = {}): LoanRow => ({
  id: 'l1',
  loanNumber: 7,
  borrowerId: 'b1',
  dateGiven: '2024-02-10',
  startMonth: '2024-03-01',
  primaryAmount: '10000.00',
  serviceChargePercent: '1.00',
  serviceChargeAmount: '100.00',
  amountUserReceived: '9900.00',
  markupPercent: '25.00',
  totalRepayment: '12500.00',
  profitAmount: '2500.00',
  tenureMonths: 5,
  paymentFrequency: 'monthly',
  installmentAmount: '2500.00',
  totalInstallments: 5,
  status: 'active',
  notes: null,
  welcomeSentAt: null,
  borrowerAcceptedAt: null,
  ownerAcceptedAt: null,
  createdAt: new Date('2024-02-10T05:00:00Z'),
  createdByName: 'Sai',
  ...over,
});

const payment = (over: Partial<PaymentRow> = {}): PaymentRow => ({
  loanId: 'l1',
  installmentNumber: 1,
  dueDate: '2024-03-01',
  amountDue: '2500.00',
  amountPaid: '0.00',
  paidDate: null,
  status: 'pending',
  paymentMethod: null,
  ...over,
});

const data = (over: Partial<SheetData> = {}): SheetData => ({
  loans: [loan()],
  borrowers: [borrower()],
  payments: [],
  ...over,
});

const headerIndex = (header: string[], label: string) => {
  const index = header.indexOf(label);
  if (index < 0) throw new Error(`no "${label}" column`);
  return index;
};

describe('month columns', () => {
  it('runs from the first month anyone paid to the current one', () => {
    const months = paymentMonths(
      [payment({ paidDate: '2024-03-15', amountPaid: '2500.00', status: 'paid' })],
      new Date('2024-06-20T00:00:00Z'),
    );
    expect(months.map((m) => `${m.year}-${m.month}`)).toEqual([
      '2024-3', '2024-4', '2024-5', '2024-6',
    ]);
  });

  it('crosses a year boundary', () => {
    const months = paymentMonths(
      [payment({ paidDate: '2024-11-02', amountPaid: '2500.00', status: 'paid' })],
      new Date('2025-02-01T00:00:00Z'),
    );
    expect(months).toHaveLength(4);
    expect(months.at(-1)).toEqual({ year: 2025, month: 2 });
  });

  it('extends past today rather than dropping a future-dated payment', () => {
    const months = paymentMonths(
      [
        payment({ paidDate: '2026-01-05', amountPaid: '2500.00', status: 'paid' }),
        payment({ paidDate: '2026-09-05', amountPaid: '2500.00', status: 'paid' }),
      ],
      new Date('2026-03-01T00:00:00Z'),
    );
    expect(months.at(-1)).toEqual({ year: 2026, month: 9 });
  });

  it('still gives one column when nothing has been paid', () => {
    expect(paymentMonths([], new Date('2025-08-09T00:00:00Z'))).toEqual([
      { year: 2025, month: 8 },
    ]);
  });

  it('ignores an unpaid instalment that carries no money', () => {
    const months = paymentMonths(
      [
        payment({ paidDate: '2024-03-15', amountPaid: '2500.00', status: 'paid' }),
        payment({ paidDate: '2023-01-01', amountPaid: '0.00', status: 'pending' }),
      ],
      new Date('2024-04-01T00:00:00Z'),
    );
    expect(months[0]).toEqual({ year: 2024, month: 3 });
  });

  it('reads the month off the date string, not a parsed Date', () => {
    // The 1st of a month is the case that breaks: parsed as UTC midnight it lands in the
    // previous month for any timezone behind UTC, filing the payment a month early.
    const months = paymentMonths(
      [payment({ paidDate: '2024-03-01', amountPaid: '2500.00', status: 'paid' })],
      new Date('2024-03-10T00:00:00Z'),
    );
    expect(months).toEqual([{ year: 2024, month: 3 }]);
  });
});

describe('collections by month', () => {
  it('files money under the month it arrived, not the month it was due', () => {
    const collected = collectionsByMonth([
      payment({ dueDate: '2024-03-01', paidDate: '2024-05-20', amountPaid: '2500.00', status: 'paid' }),
    ]);
    expect(collected.get('l1')?.get('2024-05')).toBe(2500);
    expect(collected.get('l1')?.get('2024-03')).toBeUndefined();
  });

  it('adds up two instalments settled in the same month', () => {
    const collected = collectionsByMonth([
      payment({ installmentNumber: 1, paidDate: '2024-04-02', amountPaid: '2500.00', status: 'paid' }),
      payment({ installmentNumber: 2, paidDate: '2024-04-27', amountPaid: '1000.00', status: 'partial' }),
    ]);
    expect(collected.get('l1')?.get('2024-04')).toBe(3500);
  });

  it('keeps loans apart', () => {
    const collected = collectionsByMonth([
      payment({ loanId: 'l1', paidDate: '2024-04-02', amountPaid: '2500.00', status: 'paid' }),
      payment({ loanId: 'l2', paidDate: '2024-04-02', amountPaid: '900.00', status: 'paid' }),
    ]);
    expect(collected.get('l1')?.get('2024-04')).toBe(2500);
    expect(collected.get('l2')?.get('2024-04')).toBe(900);
  });
});

describe('loan totals', () => {
  it('counts a waived instalment as settled without counting it as cash', () => {
    const totals = loanTotals(loan(), [
      payment({ installmentNumber: 1, paidDate: '2024-03-05', amountPaid: '2500.00', status: 'paid' }),
      payment({ installmentNumber: 2, status: 'waived', amountPaid: '0.00' }),
    ]);
    expect(totals.paid).toBe(2500);
    expect(totals.waived).toBe(2500);
    expect(totals.instalmentsSettled).toBe(2);
    expect(totals.outstanding).toBe(7500);
  });

  it('never reports a negative outstanding after an overpayment', () => {
    const totals = loanTotals(loan(), [
      payment({ amountPaid: '13000.00', paidDate: '2024-03-05', status: 'paid' }),
    ]);
    expect(totals.outstanding).toBe(0);
  });

  it('takes the latest paid date, whatever order the rows arrive in', () => {
    const totals = loanTotals(loan(), [
      payment({ installmentNumber: 2, paidDate: '2024-06-01', amountPaid: '2500.00', status: 'paid' }),
      payment({ installmentNumber: 1, paidDate: '2024-03-01', amountPaid: '2500.00', status: 'paid' }),
    ]);
    expect(totals.lastPaidDate).toBe('2024-06-01');
  });
});

describe('loans tab', () => {
  const today = new Date('2024-05-15T00:00:00Z');

  it('puts every month column after every detail column', () => {
    const tab = buildLoansTab(
      data({ payments: [payment({ paidDate: '2024-03-10', amountPaid: '2500.00', status: 'paid' })] }),
      today,
    );
    const firstMonth = tab.header.indexOf('Mar 2024');
    expect(firstMonth).toBeGreaterThan(headerIndex(tab.header, 'Paid'));
    expect(tab.header.slice(firstMonth)).toEqual(['Mar 2024', 'Apr 2024', 'May 2024']);
  });

  it('gives every row exactly as many cells as there are headers', () => {
    const tab = buildLoansTab(
      data({
        loans: [loan(), loan({ id: 'l2', loanNumber: 8 })],
        payments: [payment({ paidDate: '2024-03-10', amountPaid: '2500.00', status: 'paid' })],
      }),
      today,
    );
    for (const row of tab.rows) expect(row).toHaveLength(tab.header.length);
  });

  it('writes the phone as text so a leading zero survives', () => {
    const tab = buildLoansTab(
      data({ borrowers: [borrower({ mobile: '0000000042' })] }),
      today,
    );
    const cell = tab.rows[0][headerIndex(tab.header, 'Phone')];
    expect(cell).toEqual({ kind: 'text', value: '0000000042' });
  });

  it('leaves a month with no collection blank rather than zero', () => {
    const tab = buildLoansTab(
      data({ payments: [payment({ paidDate: '2024-03-10', amountPaid: '2500.00', status: 'paid' })] }),
      today,
    );
    expect(tab.rows[0][headerIndex(tab.header, 'Mar 2024')]).toEqual({
      kind: 'number', value: 2500, money: true,
    });
    expect(tab.rows[0][headerIndex(tab.header, 'Apr 2024')]).toEqual({ kind: 'empty' });
  });

  it('carries only the money columns that were asked for', () => {
    const tab = buildLoansTab(data(), today);
    expect(tab.rows[0][headerIndex(tab.header, 'Given')]).toMatchObject({ value: 9900 });
    expect(tab.rows[0][headerIndex(tab.header, 'Principal')]).toMatchObject({ value: 10000 });
    expect(tab.rows[0][headerIndex(tab.header, 'Profit')]).toMatchObject({ value: 2500 });

    // Dropped on purpose. Listed rather than asserted by count so that re-adding one is a
    // deliberate edit here, not something a header change does silently.
    for (const gone of [
      'Total repayable', 'Service charge %', 'Service charge', 'Markup %', 'Tenure (months)',
      'Frequency', 'Instalment', 'Instalments', 'Status', 'Waived', 'Outstanding',
      'Instalments settled', 'Last payment', 'Repayment starts', 'Welcome sent',
      'Borrower accepted', 'Owner accepted', 'Notes', 'Created by', 'Created at',
    ]) {
      expect(tab.header, `"${gone}" should no longer be a column`).not.toContain(gone);
    }
  });

  it('colours a finished loan green and a defaulted one red, leaving live ones plain', () => {
    const tab = buildLoansTab(
      data({
        loans: [
          loan({ id: 'l1', loanNumber: 1, status: 'active' }),
          loan({ id: 'l2', loanNumber: 2, status: 'completed' }),
          loan({ id: 'l3', loanNumber: 3, status: 'defaulted' }),
          loan({ id: 'l4', loanNumber: 4, status: 'extended' }),
        ],
      }),
      today,
    );
    expect(tab.rowBackgrounds).toEqual([
      null,
      { red: 0.851, green: 0.918, blue: 0.827 },
      { red: 0.957, green: 0.8, blue: 0.8 },
      null,
    ]);
  });

  it('gives one background per row, so the colours cannot slip out of step', () => {
    const tab = buildLoansTab(
      data({ loans: [loan({ id: 'l1' }), loan({ id: 'l2', loanNumber: 8 })] }),
      today,
    );
    expect(tab.rowBackgrounds).toHaveLength(tab.rows.length);
  });

  it('leads with the Telugu name here too', () => {
    const tab = buildLoansTab(data(), today);
    expect(tab.header.indexOf('Name (Telugu)')).toBeLessThan(tab.header.indexOf('Name'));
    expect(tab.rows[0][headerIndex(tab.header, 'Name (Telugu)')]).toEqual({
      kind: 'text', value: 'రవి కుమార్',
    });
    expect(tab.rows[0][headerIndex(tab.header, 'Name')]).toEqual({
      kind: 'text', value: 'Ravi Kumar',
    });
  });

  it('writes the date given as a real date, not text that looks like one', () => {
    const tab = buildLoansTab(data({ loans: [loan({ dateGiven: '2025-09-11' })] }), today);
    // 45911 is 11 Sep 2025 as a spreadsheet serial; the dd-mmm-yyyy pattern renders it
    // 11-Sep-2025. Sorting and date filters keep working, which text would break.
    expect(tab.rows[0][headerIndex(tab.header, 'Date given')]).toEqual({ kind: 'date', value: 45911 });
    expect(date(2025, 9, 11)).toEqual({ kind: 'date', value: 45911 });
  });

  it('reads the date off the string, so it cannot shift a day by timezone', () => {
    const tab = buildLoansTab(data({ loans: [loan({ dateGiven: '2024-01-01' })] }), today);
    expect(tab.rows[0][headerIndex(tab.header, 'Date given')]).toEqual(date(2024, 1, 1));
  });

  it('freezes through both name columns, so a row stays identifiable at the far right', () => {
    const tab = buildLoansTab(data(), today);
    // Derived from the header rather than hard-coded: inserting a column before the names
    // must move the freeze with them, and a fixed number would silently stop covering.
    expect(tab.frozenColumns).toBe(tab.header.indexOf('Name') + 1);
    expect(tab.header.slice(0, tab.frozenColumns)).toEqual(['#', 'Name (Telugu)', 'Name']);
  });

  it('orders rows by loan number, as the query hands them over', () => {
    const tab = buildLoansTab(
      data({ loans: [loan({ id: 'l1', loanNumber: 7 }), loan({ id: 'l2', loanNumber: 12 })] }),
      today,
    );
    expect(tab.rows.map((r) => r[0])).toEqual([
      { kind: 'number', value: 7 },
      { kind: 'number', value: 12 },
    ]);
  });
});

describe('borrowers tab', () => {
  const build = (over: Partial<SheetData> = {}) =>
    buildBorrowersTab(data(over), 'https://app.example.com');

  it('lists the borrower’s loan numbers, not their ids', () => {
    const tab = build({
      loans: [loan({ id: 'l1', loanNumber: 7 }), loan({ id: 'l2', loanNumber: 12 })],
    });
    expect(tab.rows[0][headerIndex(tab.header, 'Loans')]).toEqual({
      kind: 'text', value: '7, 12',
    });
  });

  it('renders the profile photo and links the Aadhaar', () => {
    const tab = build({
      borrowers: [borrower({
        profilePhotoUrl: 'https://cdn.example.com/p.jpg',
        aadhaarPhotoUrl: 'https://cdn.example.com/a.jpg',
      })],
    });
    expect(tab.rows[0][headerIndex(tab.header, 'Photo')]).toEqual({
      kind: 'formula', value: '=IMAGE("https://cdn.example.com/p.jpg",4,90,90)',
    });
    expect(tab.rows[0][headerIndex(tab.header, 'Aadhaar')]).toMatchObject({ kind: 'formula' });
    expect((tab.rows[0][headerIndex(tab.header, 'Aadhaar')] as { value: string }).value)
      .toContain('HYPERLINK');
  });

  it('leaves the photo cells empty when there is no photo', () => {
    const tab = build();
    expect(tab.rows[0][headerIndex(tab.header, 'Photo')]).toEqual({ kind: 'empty' });
    expect(tab.rows[0][headerIndex(tab.header, 'Aadhaar')]).toEqual({ kind: 'empty' });
  });

  it('escapes a quote in an address so the formula cannot break', () => {
    const tab = build({
      borrowers: [borrower({ locationLat: '14.4', locationLng: '78.8' })],
    });
    const cell = tab.rows[0][headerIndex(tab.header, 'Location')] as { value: string };
    expect(cell.value).toBe('=HYPERLINK("https://www.google.com/maps/search/?api=1&query=14.4,78.8","14.4, 78.8")');
  });

  it('names the surety instead of showing their id', () => {
    const tab = build({
      borrowers: [
        borrower({ id: 'b1', suretyType: 'existing_borrower', suretyReferenceId: 'b2' }),
        borrower({ id: 'b2', name: 'Lakshmi', mobile: '9000000000' }),
      ],
    });
    expect(tab.rows[0][headerIndex(tab.header, 'Surety')]).toEqual({
      kind: 'text', value: 'Lakshmi',
    });
  });

  it('rolls a borrower’s loans up into one set of totals', () => {
    const tab = build({
      loans: [loan({ id: 'l1' }), loan({ id: 'l2', loanNumber: 8 })],
      payments: [payment({ loanId: 'l1', paidDate: '2024-03-01', amountPaid: '2500.00', status: 'paid' })],
    });
    expect(tab.rows[0][headerIndex(tab.header, 'Total repayable')]).toMatchObject({ value: 25000 });
    expect(tab.rows[0][headerIndex(tab.header, 'Paid')]).toMatchObject({ value: 2500 });
    expect(tab.rows[0][headerIndex(tab.header, 'Outstanding')]).toMatchObject({ value: 22500 });
  });

  it('puts the Telugu name before the English one', () => {
    const tab = build();
    expect(tab.header.indexOf('Name (Telugu)')).toBeLessThan(tab.header.indexOf('Name'));
    expect(tab.rows[0][headerIndex(tab.header, 'Name (Telugu)')]).toEqual({
      kind: 'text', value: 'రవి కుమార్',
    });
    expect(tab.rows[0][headerIndex(tab.header, 'Name')]).toEqual({
      kind: 'text', value: 'Ravi Kumar',
    });
  });

  it('numbers rows from one and gives every row a full set of cells', () => {
    const tab = build({
      borrowers: [borrower({ id: 'b1' }), borrower({ id: 'b2', mobile: '9000000000' })],
    });
    expect(tab.rows[0][0]).toEqual({ kind: 'number', value: 1 });
    expect(tab.rows[1][0]).toEqual({ kind: 'number', value: 2 });
    for (const row of tab.rows) expect(row).toHaveLength(tab.header.length);
  });

  it('freezes through both name columns here too', () => {
    const tab = build();
    expect(tab.frozenColumns).toBe(tab.header.indexOf('Name') + 1);
    expect(tab.header.slice(0, tab.frozenColumns)).toEqual(['#', 'Loans', 'Name (Telugu)', 'Name']);
  });

  it('builds the portal link from the app url', () => {
    const tab = build();
    const cell = tab.rows[0][headerIndex(tab.header, 'Portal link')] as { value: string };
    expect(cell.value).toContain('https://app.example.com/portal/tok');
  });
});
