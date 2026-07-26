# Loan welcome message and two-sided consent

Welcome ("swagatham") message on WhatsApp carrying the loan terms, with a link the
borrower taps to record acceptance — plus an equivalent acceptance action for the owner,
so the agreement is recorded from both sides.

The template wording itself lives in [whatsapp-templates.md](./whatsapp-templates.md).

---

## Setup checklist

Nothing sends until these are done. Steps 1 and 2 must be done by you — they need access
to Meta Business Manager and to production environment variables.

- [ ] **Create the template in Meta.** WhatsApp Manager → Message templates → Create.
      Body, button, and a sample value for every placeholder are in
      [whatsapp-templates.md](./whatsapp-templates.md). Name it `loan_welcome_te`,
      category **Utility**, language **Telugu**.
- [ ] **Set `WHATSAPP_WELCOME_TEMPLATE_NAME`** to the approved template name.
- [ ] **Point `APP_URL` at the real host.** It is currently `http://localhost:3004`.
      It must match the URL prefix baked into the approved template's button, or the
      button will open the wrong site.
- [ ] Confirm `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` and
      `WHATSAPP_TEMPLATE_LANGUAGE` are set in production (they already exist locally).

A borrower who has never messaged you has no open 24-hour window, so the welcome can
**only** go as an approved template. Free-form text is rejected by the API. Approval is
usually minutes but can take up to a day, and first-attempt rejections are common — see
the rejection notes in the template doc.

---

## What the owner sees

An **Agreement** card on the loan detail screen (`/loans/$loanId`), between repayment
progress and loan info. It shows both parties with a status dot each:

| Party | States |
|---|---|
| Borrower | Not sent yet → Awaiting borrower → accepted date |
| Owner | Not accepted → accepted date |

Two actions on the card:

- **Accept as owner** — records the lender's side. Disappears once accepted.
- **Send welcome on WhatsApp** — becomes "Send welcome again" after the first send, and
  the card then shows when it went out. Hidden if the borrower has already accepted, or
  if their mobile is not a valid Indian number.

## What the borrower sees

The WhatsApp button opens their existing portal at `/portal/<token>`. Any loan they have
not yet accepted appears as a consent card **above** their balances, showing loan number,
amount received, total repayable, and instalment × count, followed by a plain-language
declaration and an **I accept** button. Once accepted the card collapses to a confirmation
with the date, and the portal looks as it did before.

---

## Data model

Six nullable columns added to `loans`:

| Column | Purpose |
|---|---|
| `borrower_accepted_at` | When the borrower accepted |
| `borrower_acceptance_ip` | Captured at acceptance, as evidence |
| `borrower_acceptance_user_agent` | Captured at acceptance, as evidence |
| `owner_accepted_at` | When the owner accepted |
| `owner_accepted_by` | Which user accepted, FK to `users` |
| `welcome_sent_at` | Last time the welcome template was sent |

These were applied to the live database with a targeted
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` rather than `drizzle-kit push`, to avoid a
whole-schema diff proposing unrelated changes. `src/server/db/schema.ts` matches.

IP and user agent are stored so the acceptance is evidence rather than just a flag, if
the borrower later disputes having agreed.

---

## Design decisions

**Acceptance is write-once.** Tapping accept again returns the original timestamp instead
of overwriting it, so the recorded date stays trustworthy.

**The borrower endpoint is unauthenticated by design.** The portal token is the
credential, exactly as it already is for viewing the portal. It verifies that the token
*owns the loan being accepted*, so a valid token cannot be used to accept somebody else's
loan.

**Consent is per loan, not per borrower.** A borrower with three loans accepts each one,
which is what an agreement record needs.

**Acceptance is currently non-blocking.** The portal still shows loans whether or not the
borrower has accepted. Making it gate access is a small change — see open items.

---

## Files

| File | Role |
|---|---|
| `src/server/functions/consent.ts` | `acceptLoanAsBorrower`, `acceptLoanAsOwner` |
| `src/server/functions/whatsapp.ts` | `sendLoanWelcomeWhatsApp` + shared send helper |
| `src/components/loans/LoanAgreementCard.tsx` | Owner-facing card |
| `src/components/portal/LoanConsentCard.tsx` | Borrower-facing card |
| `src/routes/portal/$token.tsx` | Surfaces pending consents |
| `src/server/functions/portal.ts` | Returns acceptance state to the portal |
| `src/server/db/schema.ts` | The six new columns |
| `docs/whatsapp-templates.md` | Template text and submission guide |

---

## Open items

- **Should consent block the portal?** Currently advisory. Unanswered from the original
  discussion — say the word and loans stay hidden until accepted.
- **Portal tokens never expire.** `portal_token_expiry` is nullable and never set, so the
  WhatsApp link is permanent, and anyone it is forwarded to sees the borrower's full loan
  history. Worth setting an expiry now that the link goes to every new borrower.
- **Location capture was dropped** per your instruction. Continuous tracking is not
  possible from a web page (permission only applies while the tab is open and in the
  foreground) and is restricted for lenders under RBI's digital lending guidelines. A
  one-time capture on the consent page remains available if wanted; the geolocation code
  already exists in `BorrowerForm`.
- **Body has 4 variables** (name, principal, instalment count, instalment amount) and the
  code sends exactly those four. Changing the template means changing
  `sendLoanWelcomeWhatsApp` — a count mismatch fails the send outright.
- **Automatic send on loan creation** is not wired up. Sending is a manual button today,
  which is the safer default while the template is unproven.

---

## Verification status

Typecheck clean apart from a pre-existing unused `daysSince` in `LoanCard.tsx`. All 70
tests pass. All new modules compile and are served by Vite without transform errors.

**Not verified:** nothing has been exercised in a browser, and no WhatsApp message has
actually been sent, because the template does not exist yet. The first real send is the
test that matters.
