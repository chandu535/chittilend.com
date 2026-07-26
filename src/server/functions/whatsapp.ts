import { createServerFn } from '@tanstack/react-start';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { loans } from '../db/schema';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const WHATSAPP_GRAPH_API_VERSION = 'v24.0';

/** How long an acceptance link stays valid after the welcome is sent. */
const CONSENT_LINK_TTL_DAYS = 30;

/** Formats a plain rupee figure for a template parameter — no symbol, no grouping. */
function money(value: string | number): string {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

async function sendTemplate(body: unknown) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp is not configured. Add the WhatsApp environment variables to the server.');
  }

  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  const result = await response.json() as { messages?: Array<{ id: string }>; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || 'WhatsApp message could not be sent');
  return result;
}

/**
 * Sends the "swagatham" welcome with the loan terms and a button linking to the
 * borrower's consent page. Requires a separate approved template from the payment
 * reminder — see docs/whatsapp-templates.md.
 */
export const sendLoanWelcomeWhatsApp = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const loanId = (data as { loanId?: string }).loanId;
    if (!loanId) throw new Error('Loan ID is required');
    return { loanId };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const templateName = process.env.WHATSAPP_WELCOME_TEMPLATE_NAME;
    const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE;
    if (!templateName || !templateLanguage) {
      throw new Error('Set WHATSAPP_WELCOME_TEMPLATE_NAME and WHATSAPP_TEMPLATE_LANGUAGE on the server.');
    }
    // The link host lives in the approved template's URL prefix, not here — APP_URL only
    // needs to agree with it. Guarding on it catches a localhost value reaching production.
    if (!process.env.APP_URL) {
      throw new Error('Set APP_URL on the server so consent links match the approved template.');
    }

    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, data.loanId),
      with: {
        borrower: { columns: { name: true, nameTelugu: true, mobile: true } },
      },
    });

    if (!loan) throw new Error('Loan not found');
    if (!/^[6-9]\d{9}$/.test(loan.borrower.mobile)) {
      throw new Error('Borrower does not have a valid Indian mobile number');
    }

    // Reuse the existing token when resending, so an earlier message's link keeps working.
    // A fresh one is minted only when there is none, or the old one has lapsed.
    const expired = loan.consentTokenExpiry && new Date(loan.consentTokenExpiry) < new Date();
    const consentToken = loan.consentToken && !expired
      ? loan.consentToken
      : randomBytes(32).toString('hex');
    const consentTokenExpiry = new Date(Date.now() + CONSENT_LINK_TTL_DAYS * 86_400_000);

    await sendTemplate({
      messaging_product: 'whatsapp',
      to: `91${loan.borrower.mobile}`,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: [
          {
            // Order must match the approved template exactly — see docs/whatsapp-templates.md.
            // {{1}} name, {{2}} principal, {{3}} instalment count, {{4}} instalment amount.
            type: 'body',
            parameters: [
              { type: 'text', text: loan.borrower.nameTelugu || loan.borrower.name },
              { type: 'text', text: money(loan.primaryAmount) },
              { type: 'text', text: String(loan.totalInstallments) },
              { type: 'text', text: money(loan.installmentAmount) },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            // Appended to the template's fixed URL prefix, so only the token travels.
            parameters: [{ type: 'text', text: consentToken }],
          },
        ],
      },
    });

    // Persisted only after Meta accepts the message, so a failed send never leaves a
    // token behind that no borrower ever received.
    const now = new Date();
    await db
      .update(loans)
      .set({ consentToken, consentTokenExpiry, welcomeSentAt: now, updatedAt: now })
      .where(eq(loans.id, loan.id));

    return { sent: true };
  });

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
