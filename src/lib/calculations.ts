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

export function calculateStartMonth(dateGiven: Date): Date {
  return new Date(dateGiven.getFullYear(), dateGiven.getMonth() + 1, 1);
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
    const dueDate = new Date(startDate);
    if (frequency === 'monthly') {
      dueDate.setMonth(dueDate.getMonth() + i);
    } else {
      dueDate.setDate(dueDate.getDate() + (i * 7));
    }

    schedule.push({
      installmentNumber: i + 1,
      dueDate,
      amountDue: i === totalInstallments - 1 ? baseAmount + remainder : baseAmount,
    });
  }
  return schedule;
}
