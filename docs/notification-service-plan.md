# WhatsApp notifications — spec

Status: **spec agreed, not built.**

---

## The rules

| When | Message | Count |
|---|---|---|
| Loan created | Welcome + consent link | **1 per loan**, once ever |
| **5th** of each month | Reminder | |
| **9th** of each month | Reminder | |
| **11th** of each month | Warning (overdue) | |

**Maximum 3 reminders per active loan per month**, and only while that instalment is still unpaid. Paid instalment → no message. Loan completed or defaulted → no message.

Sent at **10:00 IST**. RBI's Digital Lending Directions permit contacting a borrower only between 08:00 and 19:00, so the send is gated on IST clock time in code, not just by the cron schedule — a retry or a late run must not be able to fire outside the window.

## Which instalment counts

The **earliest unpaid instalment** on each active loan — the same "next payment" the loans list already shows. If it is unpaid on the 5th, the 9th, or the 11th, that date's message goes out.

Note your stored `due_date` values fall on month-end and the 1st, while your collection deadline is the 10th. The schedule above is therefore **calendar-driven**, not derived from `due_date`, which matches how you actually collect.

## One message per borrower per day

A borrower with three active loans gets **one** message on the 5th, not three. It covers the most urgent loan. This is the main guard against being blocked, which is what degrades delivery for everything else.

---

## Templates to create in Meta

Three new ones, all **Utility** category, Telugu. Utility avoids the ~2-per-day marketing cap that applies across all brands, and costs ~₹0.13 instead of ~₹0.85.

| Template | Used on |
|---|---|
| `payment_reminder_te` | 5th and 9th |
| `payment_warning_te` | 11th |
| `loan_welcome_te` | Loan creation — **already written**, see [whatsapp-templates.md](./whatsapp-templates.md) |

Reusing one reminder template for both the 5th and the 9th keeps it to three. If you want the 9th to read more urgently than the 5th, that is a fourth template.

Wording must avoid anything that reads as shaming or threatening — RBI prohibits it, and Meta will reclassify a promotional-sounding template as Marketing, which costs 6× more.

## Limits — not a concern

250 templates allowed (6,000 once business-verified); we need 4. Messaging is capped at 250 unique recipients per rolling 24h to start, and you have 9 borrowers with active loans. Cost at this volume is roughly **₹15/month**.

---

## To build

1. **`notification_log` table** — one row per (loan, template, month), unique, written before the send. Without it a cron retry or a mid-run deploy double-messages, and there is no audit trail if a borrower ever alleges harassment.
2. **Send gate** — refuses outside 08:00–19:00 IST, refuses a second message to the same borrower the same day, refuses a duplicate log row.
3. **One Vercel cron**, `30 4 * * *` UTC = 10:00 IST daily. Exits immediately unless the date is the 5th, 9th or 11th. Refreshes overdue statuses first — currently `bulkUpdateOverdueStatus` only runs when someone opens the payments or dashboard page, so statuses are stale until a human looks.
4. **Notifications list** in Settings — what went out, what failed.

## Getting to one-tap payment

`upi://pay` links with a prefilled amount are declined by UPI apps when the payee is a
personal P2P address — verified confirmation is in
[whatsapp-templates.md](./whatsapp-templates.md). Messages now send the plain UPI ID
instead, which works but means the borrower types the amount. Three ways to improve that,
cheapest first:

| Option | What it gives | Cost / effort |
|---|---|---|
| **Static QR image** as the template header | Borrower scans instead of typing the ID. A QR with no amount is not subject to the intent restriction. One image, generated once, stored in R2 — we already have R2 wired up. | Free. Half a day. Amount still typed. |
| **Merchant VPA** via a PSP or aggregator | Signed intents with prefilled amount work, so one tap pays the exact figure. Also unlocks **webhooks**, which would let payments reconcile themselves instead of being marked by hand. | Needs business registration; UPI P2M is often 0% |
| **Payment gateway link** (Razorpay / Cashfree) | An `https` link, so it can be a real WhatsApp button. Prefilled amount, auto-reconciliation. | ~2% per transaction — on a ₹12,500 instalment that is ₹250, likely too much |

The middle option is the one worth pursuing, mainly for the webhooks: automatic
reconciliation removes the manual "mark as paid" step, which is where partial-payment
mistakes creep in today.

## Blocker

The two new templates need Meta approval before any of this can be tested. Everything else can be built and verified against the log without sending.
