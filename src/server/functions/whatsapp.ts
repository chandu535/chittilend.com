import { createServerFn } from '@tanstack/react-start';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { loans, payments } from '../db/schema';
import { getAuthenticatedUser } from '../middleware/auth';
import { requirePermission } from '../middleware/roleGuard';

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
 * Receipt for a recorded payment, with the loan's new standing.
 *
 * Not a server function: it is called from inside markPaymentPaid, and is deliberately
 * best-effort. Recording money must never fail because a messaging API is down, so every
 * failure here is logged and swallowed. Skips entirely until the template is configured.
 */
export async function sendPaymentReceipt(paymentId: string): Promise<void> {
  const templateName = process.env.WHATSAPP_RECEIPT_TEMPLATE_NAME;
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE;
  if (!templateName || !templateLanguage) return;

  try {
    const [row] = await db
      .select({ loanId: payments.loanId, amountPaid: payments.amountPaid })
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);
    if (!row) return;

    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, row.loanId),
      with: {
        borrower: { columns: { name: true, nameTelugu: true, mobile: true } },
        payments: { columns: { status: true, amountPaid: true } },
      },
    });
    if (!loan) return;
    if (!/^[6-9]\d{9}$/.test(loan.borrower.mobile)) return;

    // Computed after the write, so the figures describe the loan's new state.
    const paidInstalments = loan.payments.filter((p) => p.status === 'paid').length;
    const collected = loan.payments.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
    const outstanding = Math.max(0, parseFloat(loan.totalRepayment) - collected);
    const remainingInstalments = Math.max(0, loan.totalInstallments - paidInstalments);

    await sendTemplate({
      messaging_product: 'whatsapp',
      to: `91${loan.borrower.mobile}`,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: [
          {
            // Order must match the approved template exactly: {{1}} name, {{2}} amount
            // received, {{3}} paid count, {{4}} total, {{5}} remaining count, {{6}} balance.
            type: 'body',
            parameters: [
              { type: 'text', text: loan.borrower.nameTelugu || loan.borrower.name },
              { type: 'text', text: money(row.amountPaid) },
              { type: 'text', text: String(paidInstalments) },
              { type: 'text', text: String(loan.totalInstallments) },
              { type: 'text', text: String(remainingInstalments) },
              { type: 'text', text: money(outstanding) },
            ],
          },
        ],
      },
    });
  } catch (error) {
    console.warn('[whatsapp] payment receipt failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Closure notice, sent once when the final instalment settles.
 *
 * Best-effort like the receipt, and sent *instead of* it — two messages for the same
 * event would read as spam. Skips until the template is configured.
 */
export async function sendLoanClosed(loanId: string): Promise<void> {
  const templateName = process.env.WHATSAPP_CLOSED_TEMPLATE_NAME;
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE;
  if (!templateName || !templateLanguage) return;

  try {
    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
      with: {
        borrower: { columns: { name: true, nameTelugu: true, mobile: true } },
        payments: { columns: { status: true, amountPaid: true } },
      },
    });
    if (!loan) return;
    if (!/^[6-9]\d{9}$/.test(loan.borrower.mobile)) return;

    const totalRepaid = loan.payments.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
    // Waived instalments count as completed — the loan closed, and the borrower should
    // not be told they completed fewer than they did.
    const completed = loan.payments.filter((p) => p.status === 'paid' || p.status === 'waived').length;

    await sendTemplate({
      messaging_product: 'whatsapp',
      to: `91${loan.borrower.mobile}`,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: [
          {
            // {{1}} name, {{2}} loan number, {{3}} total repaid, {{4}} instalments completed.
            type: 'body',
            parameters: [
              { type: 'text', text: loan.borrower.nameTelugu || loan.borrower.name },
              { type: 'text', text: String(loan.loanNumber) },
              { type: 'text', text: money(totalRepaid) },
              { type: 'text', text: String(completed) },
            ],
          },
        ],
      },
    });
  } catch (error) {
    console.warn('[whatsapp] loan closure notice failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Overdue warning, sent after the 10th when the instalment is still unpaid.
 * Text only — no payment link or QR. See docs/whatsapp-templates.md.
 */
export async function sendWarningTemplate(loanId: string): Promise<{ messageId?: string }> {
    const data = { loanId };
    const templateName = process.env.WHATSAPP_WARNING_TEMPLATE_NAME;
    const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE;
    if (!templateName || !templateLanguage) {
      throw new Error('Set WHATSAPP_WARNING_TEMPLATE_NAME and WHATSAPP_TEMPLATE_LANGUAGE on the server.');
    }

    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, data.loanId),
      with: {
        borrower: { columns: { name: true, nameTelugu: true, mobile: true } },
        payments: { orderBy: (payments, { asc }) => [asc(payments.installmentNumber)] },
      },
    });

    if (!loan) throw new Error('Loan not found');
    if (!/^[6-9]\d{9}$/.test(loan.borrower.mobile)) {
      throw new Error('Borrower does not have a valid Indian mobile number');
    }

    const nextPayment = loan.payments.find((p) => p.status !== 'paid' && p.status !== 'waived');
    if (!nextPayment) throw new Error('This loan has no pending payment');

    const outstanding = parseFloat(nextPayment.amountDue) - parseFloat(nextPayment.amountPaid);
    if (outstanding <= 0) throw new Error('This payment has already been settled');

    // The deadline that passed is the 10th of the month the instalment fell due in.
    // Read straight off the stored YYYY-MM-DD string: building a Date and using its
    // local getters returned the previous month on a UTC server (a 1 Jan due date came
    // out as 10-12 of the prior year), because the instant is 18:30 the day before.
    const [dueYear, dueMonth] = nextPayment.dueDate.split('-');
    const deadlineText = `10-${dueMonth}-${dueYear}`;

    const result = await sendTemplate({
      messaging_product: 'whatsapp',
      to: `91${loan.borrower.mobile}`,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: [
          {
            // Order must match the approved template exactly:
            // {{1}} name, {{2}} deadline passed, {{3}} amount outstanding.
            type: 'body',
            parameters: [
              { type: 'text', text: loan.borrower.nameTelugu || loan.borrower.name },
              { type: 'text', text: deadlineText },
              { type: 'text', text: money(outstanding) },
            ],
          },
        ],
      },
    });

    return { messageId: result.messages?.[0]?.id };
}

/** Authenticated wrapper so the loan screen can send a warning by hand. */
export const sendPaymentWarningWhatsApp = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const loanId = (data as { loanId?: string }).loanId;
    if (!loanId) throw new Error('Loan ID is required');
    return { loanId };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'messages.send');
    return sendWarningTemplate(data.loanId);
  });

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
    requirePermission(user, 'messages.send');

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

/** Monthly payment reminder. Used by the 5th and 9th cron runs and the manual button. */
export async function sendReminderTemplate(loanId: string): Promise<{ messageId?: string }> {
    const data = { loanId };
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
    // Month and year read in IST. getMonth() on a UTC server rolls over 5h30m early, so
    // a run late on the last day of a month would name the next one.
    const istParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit',
    }).formatToParts(today);
    const istPart = (type: string) => istParts.find((p) => p.type === type)?.value ?? '';
    const dueDate = `10-${istPart('month')}-${istPart('year')}`;
    const amountText = Number.isInteger(amountToPay) ? String(amountToPay) : amountToPay.toFixed(2);

    // Plain VPA, not a upi:// intent link. UPI apps decline prefilled-amount intents to a
    // personal (P2P) address that arrive from an untrusted source — the payee and amount
    // resolve fine, then the PSP refuses with "declined for security reasons" and tells
    // the user to use a UPI ID or QR instead. Signed intents need a verified merchant VPA
    // with mc/sign, which we do not have. Sending the ID lets the borrower long-press to
    // copy it and enter the amount themselves.
    const payeeVpa = process.env.UPI_VPA;
    if (!payeeVpa) throw new Error('Set UPI_VPA on the server so the payment address can be sent.');

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
                { type: 'text', text: payeeVpa },
              ],
            }],
          },
        }),
      },
    );
    const result = await response.json() as { messages?: Array<{ id: string }>; error?: { message?: string } };
    if (!response.ok) throw new Error(result.error?.message || 'WhatsApp message could not be sent');

    return { messageId: result.messages?.[0]?.id };
}

/** Authenticated wrapper so the loan screen can send a reminder by hand. */
export const sendLoanWhatsAppTemplate = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const loanId = (data as { loanId?: string }).loanId;
    if (!loanId) throw new Error('Loan ID is required');
    return { loanId };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'messages.send');
    return sendReminderTemplate(data.loanId);
  });
