import { c as createServerRpc, d as db, l as loans } from "./index-BAKXOWjL.mjs";
import { a as getAuthenticatedUser } from "./auth-DpeO-HDl.mjs";
import { r as requireRole } from "./roleGuard-MoSFikSq.mjs";
import { c as createServerFn } from "./index.mjs";
import { e as eq } from "../_libs/drizzle-orm.mjs";
import "../_chunks/_libs/@neondatabase/serverless.mjs";
import "../_libs/jose.mjs";
import "../_chunks/_libs/@tanstack/history.mjs";
import "../_chunks/_libs/@tanstack/router-core.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "../_chunks/_libs/react.mjs";
import "../_chunks/_libs/@tanstack/react-router.mjs";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
const WHATSAPP_GRAPH_API_VERSION = "v24.0";
const sendLoanWhatsAppTemplate_createServerFn_handler = createServerRpc({
  id: "2f15cf97c55a997040ea638dacd5e036f9ef72c63417c6b0124d32db95c057d7",
  name: "sendLoanWhatsAppTemplate",
  filename: "src/server/functions/whatsapp.ts"
}, (opts) => sendLoanWhatsAppTemplate.__executeServer(opts));
const sendLoanWhatsAppTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const loanId = data.loanId;
  if (!loanId) throw new Error("Loan ID is required");
  return {
    loanId
  };
}).handler(sendLoanWhatsAppTemplate_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE;
  if (!phoneNumberId || !accessToken || !templateName || !templateLanguage) {
    throw new Error("WhatsApp is not configured. Add the WhatsApp environment variables to the server.");
  }
  const loan = await db.query.loans.findFirst({
    where: eq(loans.id, data.loanId),
    with: {
      borrower: {
        columns: {
          mobile: true
        }
      },
      payments: {
        orderBy: (payments, {
          asc
        }) => [asc(payments.installmentNumber)]
      }
    }
  });
  if (!loan) throw new Error("Loan not found");
  if (!/^[6-9]\d{9}$/.test(loan.borrower.mobile)) {
    throw new Error("Borrower does not have a valid Indian mobile number");
  }
  const nextPayment = loan.payments.find((payment) => payment.status !== "paid" && payment.status !== "waived");
  if (!nextPayment) throw new Error("This loan has no pending payment");
  const amountToPay = Math.max(0, parseFloat(nextPayment.amountDue) - parseFloat(nextPayment.amountPaid));
  if (amountToPay <= 0) throw new Error("This payment has already been completed");
  const today = /* @__PURE__ */ new Date();
  const monthYear = new Intl.DateTimeFormat("te-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  }).format(today);
  const dueDate = `10-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;
  const amountText = Number.isInteger(amountToPay) ? String(amountToPay) : amountToPay.toFixed(2);
  const upiParameters = new URLSearchParams({
    pa: "9553077886sai@ybl",
    pn: "ChittiLend",
    am: amountToPay.toFixed(2),
    cu: "INR",
    tn: `Loan ${loan.loanNumber} EMI`
  });
  const paymentLink = `upi://pay?${upiParameters.toString()}`;
  const response = await fetch(`https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: `91${loan.borrower.mobile}`,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: templateLanguage
        },
        components: [{
          type: "body",
          parameters: [{
            type: "text",
            text: monthYear
          }, {
            type: "text",
            text: amountText
          }, {
            type: "text",
            text: dueDate
          }, {
            type: "text",
            text: paymentLink
          }]
        }]
      }
    })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "WhatsApp message could not be sent");
  return {
    messageId: result.messages?.[0]?.id
  };
});
export {
  sendLoanWhatsAppTemplate_createServerFn_handler
};
