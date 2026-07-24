import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { loans } from '../db/schema';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const WHATSAPP_GRAPH_API_VERSION = 'v24.0';

export const sendLoanWhatsAppTemplate = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const loanId = (data as { loanId?: string }).loanId;
    if (!loanId) throw new Error('Loan ID is required');
    return { loanId };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
    const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE;
    if (!phoneNumberId || !accessToken || !templateName || !templateLanguage) {
      throw new Error('WhatsApp is not configured. Add the WhatsApp environment variables to the server.');
    }

    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, data.loanId),
      with: {
        borrower: { columns: { mobile: true } },
        payments: {
          orderBy: (payments, { asc }) => [asc(payments.installmentNumber)],
        },
      },
    });

    if (!loan) throw new Error('Loan not found');
    if (!/^[6-9]\d{9}$/.test(loan.borrower.mobile)) {
      throw new Error('Borrower does not have a valid Indian mobile number');
    }
    const nextPayment = loan.payments.find((payment) => payment.status !== 'paid' && payment.status !== 'waived');
    if (!nextPayment) throw new Error('This loan has no pending payment');

    const amountToPay = Math.max(0, parseFloat(nextPayment.amountDue) - parseFloat(nextPayment.amountPaid));
    if (amountToPay <= 0) throw new Error('This payment has already been completed');

    const today = new Date();
    const monthYear = new Intl.DateTimeFormat('te-IN', {
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(today);
    const dueDate = `10-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    const amountText = Number.isInteger(amountToPay) ? String(amountToPay) : amountToPay.toFixed(2);
    const upiParameters = new URLSearchParams({
      pa: '9553077886sai@ybl',
      pn: 'ChittiLend',
      am: amountToPay.toFixed(2),
      cu: 'INR',
      tn: `Loan ${loan.loanNumber} EMI`,
    });
    const paymentLink = `upi://pay?${upiParameters.toString()}`;

    const response = await fetch(
      `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${loan.borrower.mobile}`,
          type: 'template',
          template: {
            name: templateName,
            language: { code: templateLanguage },
            components: [{
              type: 'body',
              parameters: [
                { type: 'text', text: monthYear },
                { type: 'text', text: amountText },
                { type: 'text', text: dueDate },
                { type: 'text', text: paymentLink },
              ],
            }],
          },
        }),
      },
    );
    const result = await response.json() as { messages?: Array<{ id: string }>; error?: { message?: string } };
    if (!response.ok) throw new Error(result.error?.message || 'WhatsApp message could not be sent');

    return { messageId: result.messages?.[0]?.id };
  });
