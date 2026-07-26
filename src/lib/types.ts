import type { users, borrowers, loans, payments, capitalPoolLog } from '@/server/db/schema';

// Inferred types from Drizzle schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Borrower = typeof borrowers.$inferSelect;
export type NewBorrower = typeof borrowers.$inferInsert;

export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type CapitalPoolEntry = typeof capitalPoolLog.$inferSelect;
export type NewCapitalPoolEntry = typeof capitalPoolLog.$inferInsert;

// Role types
export type UserRole = 'admin' | 'manager';

// Status types
export type LoanStatus = 'active' | 'completed' | 'defaulted' | 'extended';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';
export type PaymentFrequency = 'monthly' | 'weekly';
export type SuretyType = 'existing_borrower' | 'owner';
export type CapitalEventType = 'investment' | 'collection' | 'disbursement';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other';

// Dashboard summary
export interface DashboardSummary {
  totalDeployed: number;
  availableCapital: number;
  toCollect: number;
  profitEarned: number;
  activeLoans: number;
  overduePayments: number;
  thisMonthCollected: number;
  thisMonthGiven: number;
}

// Loan with borrower info (for list views)
export interface LoanWithBorrower extends Loan {
  borrower: Pick<Borrower, 'id' | 'name' | 'mobile' | 'area'>;
}

// Payment with loan and borrower info (for payment list views)
export interface PaymentWithLoanBorrower extends Payment {
  loan: Pick<Loan, 'id' | 'primaryAmount' | 'totalRepayment'>;
  borrowerName: string;
  borrowerMobile: string;
}

// Borrower with loan summary
export interface BorrowerWithSummary extends Borrower {
  activeLoansCount: number;
  totalBorrowed: number;
}

// Format options
export interface FormatOptions {
  lang: 'en' | 'te';
  useNativeNumerals?: boolean;
}
