import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { borrowers, loans, payments } from '../db/schema';

export const getPortalData = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const token = (data as { token: string }).token;
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid portal token');
    }
    return { token };
  })
  .handler(async ({ data }) => {
    // Find borrower by portal token
    const [borrower] = await db
      .select()
      .from(borrowers)
      .where(eq(borrowers.portalToken, data.token))
      .limit(1);

    if (!borrower) {
      throw new Error('Invalid portal link');
    }

    // Check expiry if set
    if (borrower.portalTokenExpiry && new Date(borrower.portalTokenExpiry) < new Date()) {
      throw new Error('Portal link has expired');
    }

    // Get all active loans for this borrower
    const borrowerLoans = await db
      .select()
      .from(loans)
      .where(eq(loans.borrowerId, borrower.id))
      .orderBy(loans.dateGiven);

    // Get payment schedules for all loans
    const loanIds = borrowerLoans.map((l) => l.id);
    let allPayments: Array<{
      id: string;
      loanId: string;
      installmentNumber: number;
      dueDate: string;
      amountDue: string;
      amountPaid: string;
      paidDate: string | null;
      status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';
    }> = [];

    if (loanIds.length > 0) {
      for (const loanId of loanIds) {
        const loanPayments = await db
          .select({
            id: payments.id,
            loanId: payments.loanId,
            installmentNumber: payments.installmentNumber,
            dueDate: payments.dueDate,
            amountDue: payments.amountDue,
            amountPaid: payments.amountPaid,
            paidDate: payments.paidDate,
            status: payments.status,
          })
          .from(payments)
          .where(eq(payments.loanId, loanId))
          .orderBy(payments.installmentNumber);

        allPayments = allPayments.concat(loanPayments);
      }
    }

    // Group payments by loan
    const loansWithPayments = borrowerLoans.map((loan) => {
      const loanPayments = allPayments.filter((p) => p.loanId === loan.id);
      const paidCount = loanPayments.filter((p) => p.status === 'paid').length;
      const totalRemaining = loanPayments
        .filter((p) => p.status !== 'paid' && p.status !== 'waived')
        .reduce((sum, p) => sum + parseFloat(p.amountDue) - parseFloat(p.amountPaid), 0);

      const nextDue = loanPayments.find(
        (p) => p.status === 'pending' || p.status === 'partial' || p.status === 'overdue',
      );

      return {
        id: loan.id,
        primaryAmount: loan.primaryAmount,
        totalRepayment: loan.totalRepayment,
        installmentAmount: loan.installmentAmount,
        totalInstallments: loan.totalInstallments,
        paymentFrequency: loan.paymentFrequency,
        status: loan.status,
        dateGiven: loan.dateGiven,
        paidCount,
        totalRemaining,
        nextDue: nextDue
          ? { dueDate: nextDue.dueDate, amountDue: nextDue.amountDue }
          : null,
        payments: loanPayments,
      };
    });

    return {
      borrower: {
        name: borrower.name,
        mobile: borrower.mobile,
      },
      loans: loansWithPayments,
    };
  });
