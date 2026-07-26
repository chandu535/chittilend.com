import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import * as schema from './schema';
import { calculateLoan, calculateStartMonth, generatePaymentSchedule } from '../../lib/calculations';

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log('Seeding database...');

  // ---- 1. Create Admin user ----
  const adminPasswordHash = await hash('admin123', 10);
  const [admin] = await db
    .insert(schema.users)
    .values({
      name: 'Admin',
      email: 'admin@sripay.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
    })
    .returning();

  console.log('Created admin user:', admin.email);

  // ---- 2. Create Manager user ----
  const managerPasswordHash = await hash('manager123', 10);
  const [manager] = await db
    .insert(schema.users)
    .values({
      name: 'Ravi Kumar',
      email: 'manager@sripay.com',
      passwordHash: managerPasswordHash,
      role: 'manager',
    })
    .returning();

  console.log('Created manager user:', manager.email);

  // ---- 3. Create Borrowers ----
  const borrowerData = [
    { name: 'Venkata Rao', mobile: '9876543210', area: 'Ameerpet' },
    { name: 'Lakshmi Devi', mobile: '9876543211', area: 'Kukatpally' },
    { name: 'Suresh Reddy', mobile: '9876543212', area: 'Madhapur' },
    { name: 'Padma Kumari', mobile: '9876543213', area: 'Dilsukhnagar' },
    { name: 'Rajesh Gupta', mobile: '9876543214', area: 'Begumpet' },
  ];

  const createdBorrowers = [];
  for (const b of borrowerData) {
    const [borrower] = await db
      .insert(schema.borrowers)
      .values({
        name: b.name,
        mobile: b.mobile,
        area: b.area,
        address: `${b.area}, Hyderabad, Telangana`,
        portalToken: randomBytes(32).toString('hex'),
        createdBy: admin.id,
      })
      .returning();
    createdBorrowers.push(borrower);
  }

  console.log(`Created ${createdBorrowers.length} borrowers`);

  // ---- 4. Create Loans with Payment Schedules ----

  // Loan 1: Active loan - 50,000 principal, 5 months
  const loan1Calc = calculateLoan(50000, 5, 'monthly', 1, 25);
  const loan1StartMonth = calculateStartMonth(new Date('2025-01-15'));
  const [loan1] = await db
    .insert(schema.loans)
    .values({
      borrowerId: createdBorrowers[0].id,
      dateGiven: '2025-01-15',
      startMonth: loan1StartMonth.toISOString().split('T')[0],
      primaryAmount: loan1Calc.primaryAmount.toFixed(2),
      serviceChargePercent: loan1Calc.serviceChargePercent.toFixed(2),
      serviceChargeAmount: loan1Calc.serviceChargeAmount.toFixed(2),
      amountUserReceived: loan1Calc.amountUserReceives.toFixed(2),
      markupPercent: loan1Calc.markupPercent.toFixed(2),
      totalRepayment: loan1Calc.totalRepayment.toFixed(2),
      tenureMonths: 5,
      paymentFrequency: 'monthly',
      installmentAmount: loan1Calc.installmentAmount.toFixed(2),
      totalInstallments: loan1Calc.totalInstallments,
      profitAmount: loan1Calc.profitAmount.toFixed(2),
      status: 'active',
      createdBy: admin.id,
    })
    .returning();

  // Generate payment schedule for loan 1
  const loan1Schedule = generatePaymentSchedule(
    loan1StartMonth,
    loan1Calc.totalRepayment,
    loan1Calc.totalInstallments,
    'monthly',
  );

  for (let i = 0; i < loan1Schedule.length; i++) {
    const scheduled = loan1Schedule[i];
    const isPaid = i < 2; // First 2 installments paid
    await db.insert(schema.payments).values({
      loanId: loan1.id,
      installmentNumber: scheduled.installmentNumber,
      dueDate: scheduled.dueDate.toISOString().split('T')[0],
      amountDue: scheduled.amountDue.toFixed(2),
      amountPaid: isPaid ? scheduled.amountDue.toFixed(2) : '0.00',
      paidDate: isPaid ? scheduled.dueDate.toISOString().split('T')[0] : null,
      status: isPaid ? 'paid' : (i === 2 ? 'overdue' : 'pending'),
      paymentMethod: isPaid ? 'cash' : null,
      recordedBy: isPaid ? admin.id : null,
    });
  }

  console.log('Created loan 1 (active) with payments');

  // Loan 2: Completed loan - 30,000 principal, 5 months
  const loan2Calc = calculateLoan(30000, 5, 'monthly', 1, 25);
  const loan2StartMonth = calculateStartMonth(new Date('2024-08-10'));
  const [loan2] = await db
    .insert(schema.loans)
    .values({
      borrowerId: createdBorrowers[1].id,
      dateGiven: '2024-08-10',
      startMonth: loan2StartMonth.toISOString().split('T')[0],
      primaryAmount: loan2Calc.primaryAmount.toFixed(2),
      serviceChargePercent: loan2Calc.serviceChargePercent.toFixed(2),
      serviceChargeAmount: loan2Calc.serviceChargeAmount.toFixed(2),
      amountUserReceived: loan2Calc.amountUserReceives.toFixed(2),
      markupPercent: loan2Calc.markupPercent.toFixed(2),
      totalRepayment: loan2Calc.totalRepayment.toFixed(2),
      tenureMonths: 5,
      paymentFrequency: 'monthly',
      installmentAmount: loan2Calc.installmentAmount.toFixed(2),
      totalInstallments: loan2Calc.totalInstallments,
      profitAmount: loan2Calc.profitAmount.toFixed(2),
      status: 'completed',
      createdBy: admin.id,
    })
    .returning();

  // All payments paid for loan 2
  const loan2Schedule = generatePaymentSchedule(
    loan2StartMonth,
    loan2Calc.totalRepayment,
    loan2Calc.totalInstallments,
    'monthly',
  );

  for (const scheduled of loan2Schedule) {
    await db.insert(schema.payments).values({
      loanId: loan2.id,
      installmentNumber: scheduled.installmentNumber,
      dueDate: scheduled.dueDate.toISOString().split('T')[0],
      amountDue: scheduled.amountDue.toFixed(2),
      amountPaid: scheduled.amountDue.toFixed(2),
      paidDate: scheduled.dueDate.toISOString().split('T')[0],
      status: 'paid',
      paymentMethod: 'cash',
      recordedBy: admin.id,
    });
  }

  console.log('Created loan 2 (completed) with payments');

  // Loan 3: Active loan - 1,00,000 principal, 5 months
  const loan3Calc = calculateLoan(100000, 5, 'monthly', 1, 25);
  const loan3StartMonth = calculateStartMonth(new Date('2025-02-01'));
  const [loan3] = await db
    .insert(schema.loans)
    .values({
      borrowerId: createdBorrowers[2].id,
      dateGiven: '2025-02-01',
      startMonth: loan3StartMonth.toISOString().split('T')[0],
      primaryAmount: loan3Calc.primaryAmount.toFixed(2),
      serviceChargePercent: loan3Calc.serviceChargePercent.toFixed(2),
      serviceChargeAmount: loan3Calc.serviceChargeAmount.toFixed(2),
      amountUserReceived: loan3Calc.amountUserReceives.toFixed(2),
      markupPercent: loan3Calc.markupPercent.toFixed(2),
      totalRepayment: loan3Calc.totalRepayment.toFixed(2),
      tenureMonths: 5,
      paymentFrequency: 'monthly',
      installmentAmount: loan3Calc.installmentAmount.toFixed(2),
      totalInstallments: loan3Calc.totalInstallments,
      profitAmount: loan3Calc.profitAmount.toFixed(2),
      status: 'active',
      createdBy: manager.id,
    })
    .returning();

  const loan3Schedule = generatePaymentSchedule(
    loan3StartMonth,
    loan3Calc.totalRepayment,
    loan3Calc.totalInstallments,
    'monthly',
  );

  for (const scheduled of loan3Schedule) {
    await db.insert(schema.payments).values({
      loanId: loan3.id,
      installmentNumber: scheduled.installmentNumber,
      dueDate: scheduled.dueDate.toISOString().split('T')[0],
      amountDue: scheduled.amountDue.toFixed(2),
      amountPaid: '0.00',
      status: 'pending',
    });
  }

  console.log('Created loan 3 (active, no payments yet)');

  // ---- 5. Capital Pool Entries ----
  const totalDisbursed =
    loan1Calc.primaryAmount + loan2Calc.primaryAmount + loan3Calc.primaryAmount;
  const totalCollected = loan2Calc.totalRepayment + (loan1Calc.installmentAmount * 2);

  // Initial investment
  await db.insert(schema.capitalPoolLog).values({
    eventType: 'investment',
    amount: '500000.00',
    runningBalance: '500000.00',
    notes: 'Initial capital pool investment',
    recordedBy: admin.id,
  });

  // Disbursements
  let balance = 500000;
  balance -= loan1Calc.primaryAmount;
  await db.insert(schema.capitalPoolLog).values({
    eventType: 'disbursement',
    amount: loan1Calc.primaryAmount.toFixed(2),
    runningBalance: balance.toFixed(2),
    referenceLoanId: loan1.id,
    recordedBy: admin.id,
  });

  balance -= loan2Calc.primaryAmount;
  await db.insert(schema.capitalPoolLog).values({
    eventType: 'disbursement',
    amount: loan2Calc.primaryAmount.toFixed(2),
    runningBalance: balance.toFixed(2),
    referenceLoanId: loan2.id,
    recordedBy: admin.id,
  });

  balance -= loan3Calc.primaryAmount;
  await db.insert(schema.capitalPoolLog).values({
    eventType: 'disbursement',
    amount: loan3Calc.primaryAmount.toFixed(2),
    runningBalance: balance.toFixed(2),
    referenceLoanId: loan3.id,
    recordedBy: manager.id,
  });

  // Collections from loan 2 (fully paid)
  balance += loan2Calc.totalRepayment;
  await db.insert(schema.capitalPoolLog).values({
    eventType: 'collection',
    amount: loan2Calc.totalRepayment.toFixed(2),
    runningBalance: balance.toFixed(2),
    referenceLoanId: loan2.id,
    notes: 'Full repayment collected',
    recordedBy: admin.id,
  });

  // Collections from loan 1 (2 installments)
  balance += loan1Calc.installmentAmount * 2;
  await db.insert(schema.capitalPoolLog).values({
    eventType: 'collection',
    amount: (loan1Calc.installmentAmount * 2).toFixed(2),
    runningBalance: balance.toFixed(2),
    referenceLoanId: loan1.id,
    notes: '2 installments collected',
    recordedBy: admin.id,
  });

  console.log('Created capital pool entries');
  console.log(`\nFinal capital pool balance: ₹${balance.toLocaleString('en-IN')}`);
  console.log(`Total disbursed: ₹${totalDisbursed.toLocaleString('en-IN')}`);
  console.log(`Total collected: ₹${totalCollected.toLocaleString('en-IN')}`);

  console.log('\n--- Seed complete ---');
  console.log('Admin login: admin@sripay.com / admin123');
  console.log('Manager login: manager@sripay.com / manager123');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
