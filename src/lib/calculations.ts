export interface LoanCalculation {
  primaryAmount: number;
  serviceChargePercent: number;
  serviceChargeAmount: number;
  amountUserReceives: number;
  markupPercent: number;
  totalRepayment: number;
  tenureMonths: number;
  paymentFrequency: 'monthly' | 'weekly';
  installmentAmount: number;
  totalInstallments: number;
  profitAmount: number;
}

export interface ScheduledPayment {
  installmentNumber: number;
  dueDate: Date;
  amountDue: number;
}

export function calculateLoan(
  primaryAmount: number,
  tenureMonths: number = 5,
  paymentFrequency: 'monthly' | 'weekly' = 'monthly',
  serviceChargePercent: number = 1,
  markupPercent: number = 25,
): LoanCalculation {
  const serviceChargeAmount = primaryAmount * (serviceChargePercent / 100);
  const amountUserReceives = primaryAmount - serviceChargeAmount;
  const totalRepayment = primaryAmount * (1 + markupPercent / 100);

  let totalInstallments: number;
  if (paymentFrequency === 'monthly') {
    totalInstallments = tenureMonths;
  } else {
    totalInstallments = tenureMonths * 4;
  }

  const installmentAmount = totalRepayment / totalInstallments;
  const profitAmount = totalRepayment - primaryAmount;

  return {
    primaryAmount,
    serviceChargePercent,
    serviceChargeAmount,
    amountUserReceives,
    markupPercent,
    totalRepayment,
    tenureMonths,
    paymentFrequency,
    installmentAmount,
    totalInstallments,
    profitAmount,
  };
}

/**
 * The first of the month after the loan was handed over.
 *
 * Built in UTC, and that is the whole of it. `new Date(y, m, 1)` is local midnight, and
 * every caller stores the result with `toISOString()` — which in IST is 18:30 the previous
 * day. So a loan given on 15 July started on 31 July instead of 1 August, and every
 * instalment after it shifted back a day with it. On a UTC machine the same code was right,
 * which is why it survived: it only misbehaves where the app actually runs.
 *
 * getFullYear and getMonth still read the local parts of `dateGiven`, because that is how
 * the caller means it — a date typed into the app is a calendar day, not an instant.
 */
export function calculateStartMonth(dateGiven: Date): Date {
  return new Date(Date.UTC(dateGiven.getFullYear(), dateGiven.getMonth() + 1, 1));
}

export function generatePaymentSchedule(
  startDate: Date,
  totalRepayment: number,
  totalInstallments: number,
  frequency: 'monthly' | 'weekly',
): ScheduledPayment[] {
  const baseAmount = Math.floor(totalRepayment / totalInstallments);
  const remainder = totalRepayment - (baseAmount * totalInstallments);

  const schedule: ScheduledPayment[] = [];
  for (let i = 0; i < totalInstallments; i++) {
    // UTC throughout, to match the start date and to survive being stored with
    // toISOString(). setMonth/setDate would work on the local parts and drag the whole
    // schedule across a day boundary in any timezone ahead of UTC.
    const dueDate = new Date(startDate);
    if (frequency === 'monthly') {
      dueDate.setUTCMonth(dueDate.getUTCMonth() + i);
    } else {
      dueDate.setUTCDate(dueDate.getUTCDate() + (i * 7));
    }

    schedule.push({
      installmentNumber: i + 1,
      dueDate,
      amountDue: i === totalInstallments - 1 ? baseAmount + remainder : baseAmount,
    });
  }
  return schedule;
}
