# WhatsApp templates

Meta must approve a template before it can be sent. A borrower who has never messaged you
has no open 24-hour window, so a welcome can **only** go out as an approved template —
free-form text is rejected by the API.

Create at **Meta Business Manager → WhatsApp Manager → Message templates → Create template**.

---

# Template 1 — `loan_welcome_te`

The swagatham welcome carrying the loan terms and a consent button.
Fields below are in the same order the Meta form asks for them. Each block is ready to
copy as-is.

## Category

**Utility**

Do not pick Marketing. Utility gets better delivery and no opt-out friction. If Meta
reclassifies it as Marketing, the wording is reading as promotional — remove anything
that sounds like an offer and resubmit.

## Name

```
loan_welcome_te
```

## Language

**Telugu** — set `WHATSAPP_TEMPLATE_LANGUAGE=te` to match.

## Header

**None.**

If you would rather have a bold heading, choose Header → Text and use `స్వాగతం`, then
delete the first line of the body below. A static header takes no variables, so no code
change is needed either way.

## Body

This is the finalised version. Copy everything inside the block, placeholders included:

```
స్వాగతం {{1}} గారు 🙏

మీ రుణ వివరాలు:

అసలు మొత్తం: *{{2}}*
వాయిదాల సంఖ్య: *{{3}}*
వాయిదా రుసుము: *{{4}}*

పై వివరాలు సరిగా ఉన్నాయో చూసుకోండి. కింది బటన్ నొక్కి మీ అంగీకారాన్ని నమోదు చేయండి.
```

The `*` pairs make the numbers bold in WhatsApp. There must be **no space between the
asterisk and the value** — `*{{3}} *` renders as literal asterisks instead of bold.

## Body sample values

Meta rejects the template if any placeholder has no example. Enter these in the
**Samples** section, in order:

| # | Meaning | Paste this |
|---|---|---|
| `{{1}}` | Borrower name | `సాయి చంద్ర` |
| `{{2}}` | Principal | `50000` |
| `{{3}}` | Number of instalments | `5` |
| `{{4}}` | Each instalment | `12500` |

These map, in this exact order, to the parameters sent by `sendLoanWelcomeWhatsApp` in
`src/server/functions/whatsapp.ts`. **Changing the number or order of placeholders
requires changing that function too** — Meta rejects a parameter-count mismatch, so the
send fails outright rather than degrading.

## Footer

```
శ్రీపే
```

Optional, 60 characters max, no variables allowed.

## Buttons

One button, **Call to action → Visit website → Dynamic**.

Button text:

```
ఆమోదించండి
```

Website URL — replace `YOUR-DOMAIN` with your real host:

```
https://YOUR-DOMAIN/portal/{{1}}
```

URL sample value:

```
https://YOUR-DOMAIN/portal/0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0
```

The host must match `APP_URL`. The code sends **only the 64-character portal token** as
the dynamic suffix, never a whole URL, which is why the prefix has to be fixed here.

> The button's `{{1}}` is numbered independently of the body's `{{1}}`. That is normal —
> body and button parameters are separate sequences.

## Finished message preview

What the borrower receives:

```
స్వాగతం సాయి చంద్ర గారు 🙏

మీ రుణ వివరాలు:

అసలు మొత్తం: 50000
వాయిదాల సంఖ్య: 5
వాయిదా రుసుము: 12500

పై వివరాలు సరిగా ఉన్నాయో చూసుకోండి. కింది బటన్ నొక్కి మీ అంగీకారాన్ని నమోదు చేయండి.

┌──────────────────┐
│  ఆమోదించండి     │
└──────────────────┘
```

## Known gaps in this version

Deliberate simplifications, recorded so they are not mistaken for bugs:

- **The total repayable is not stated.** The borrower is consenting to repay
  ₹62,500 but the message only shows 5 × 12,500. It is derivable, not declared.
- **"అసలు మొత్తం: 50000" is the principal, not what the borrower receives.** After the
  1% service charge they get ₹49,500. Someone reading the message could reasonably expect
  50,000 in hand.
- **No loan number**, so a borrower with two loans cannot tell which one this is.

The consent page behind the button does show all of these, so nothing is hidden — but if
you ever want the message itself to be the full record, those three lines are what to add,
and doing so means a new template and re-approval.

---

# Template 3 — `payment_warning_te`

Sent after the 10th when the instalment is still unpaid. Text only — no payment link and
no QR.

## Category

**Utility**

A transactional payment notice, not promotional. If Meta reclassifies it as Marketing the
cost goes from ~₹0.13 to ~₹0.85 per message and it becomes subject to the per-user daily
cap.

## Name

```
payment_warning_te
```

## Language

**Telugu**

## Header

**None.** The ⚠️ opening the body carries the emphasis.

## Body

```
⚠️ గుర్తు చేస్తున్నాము {{1}} గారు

మీ వాయిదా చెల్లింపు గడువు {{2}} నాటికి ముగిసింది. ఇంకా చెల్లింపు అందలేదు.

బాకీ మొత్తం: *{{3}}*

దయచేసి త్వరగా చెల్లించండి 🙏

ఏదైనా ఇబ్బంది ఉంటే మాతో మాట్లాడండి. మీకు అనుకూలమైన పరిష్కారం చూద్దాం.
```

The closing line is deliberate. RBI prohibits threatening or shaming language in recovery
communication, and an offer to discuss is both compliant and likelier to recover the money
than pressure. It also protects the template's quality rating — borrowers who feel
harassed block the sender, and blocks degrade delivery for every other message.

## Body sample values

Meta rejects the template if any placeholder has no example.

| # | Meaning | Paste this |
|---|---|---|
| `{{1}}` | Borrower name | `సాయి చంద్ర` |
| `{{2}}` | Deadline that passed | `10-07-2026` |
| `{{3}}` | Amount outstanding | `12500` |

## Footer

```
శ్రీపే
```

## Buttons

One button, **Call to action → Call phone number**. Optional but recommended — on an
overdue notice, a way to reach you is more likely to recover money than a message that can
only be ignored.

Button text:

```
మాట్లాడండి
```

Phone number: your collection number, in `+91XXXXXXXXXX` form.

## Finished message preview

```
⚠️ గుర్తు చేస్తున్నాము సాయి చంద్ర గారు

మీ వాయిదా చెల్లింపు గడువు 10-07-2026 నాటికి ముగిసింది. ఇంకా చెల్లింపు అందలేదు.

బాకీ మొత్తం: 12500

దయచేసి త్వరగా చెల్లించండి 🙏

ఏదైనా ఇబ్బంది ఉంటే మాతో మాట్లాడండి. మీకు అనుకూలమైన పరిష్కారం చూద్దాం.

శ్రీపే
┌──────────────────┐
│  📞 మాట్లాడండి   │
└──────────────────┘
```

## Notes

- **3 variables, in this order.** `sendPaymentWarningWhatsApp` passes exactly these three;
  a count mismatch fails the send outright rather than degrading.
- `*{{3}}*` makes the amount bold. No space between the asterisk and the placeholder, or
  WhatsApp renders literal asterisks.
- No payment link. A `upi://pay` link with a prefilled amount to a personal address is
  declined by UPI apps — the borrower pays however they normally do.

---

# Template 4 — `payment_received_te`

Receipt, sent automatically when a payment is recorded. Confirms the money arrived and
restates where the loan now stands.

## Category

**Utility**

## Name

```
payment_received_te
```

## Language

**Telugu**

## Header

**None.** The ✅ opening the body carries the confirmation.

## Body

```
✅ చెల్లింపు అందింది, ధన్యవాదాలు {{1}} గారు 🙏

అందిన మొత్తం: *{{2}}*

చెల్లించిన వాయిదాలు: *{{3}} / {{4}}*
మిగిలిన వాయిదాలు: *{{5}}*
మిగిలిన మొత్తం: *{{6}}*

ఈ చెల్లింపు మా రికార్డులో నమోదైంది.
```

## Body sample values

Meta rejects the template if any placeholder has no example.

| # | Meaning | Paste this |
|---|---|---|
| `{{1}}` | Borrower name | `సాయి చంద్ర` |
| `{{2}}` | Amount received now | `12500` |
| `{{3}}` | Instalments paid so far | `2` |
| `{{4}}` | Total instalments | `5` |
| `{{5}}` | Instalments remaining | `3` |
| `{{6}}` | Amount still outstanding | `37500` |

`{{5}}` is derivable from `{{3}}` and `{{4}}`, but stating it saves the borrower doing the
arithmetic — which is the point of a receipt.

## Footer

```
శ్రీపే
```

## Finished message preview

```
✅ చెల్లింపు అందింది, ధన్యవాదాలు సాయి చంద్ర గారు 🙏

అందిన మొత్తం: 12500

చెల్లించిన వాయిదాలు: 2 / 5
మిగిలిన వాయిదాలు: 3
మిగిలిన మొత్తం: 37500

ఈ చెల్లింపు మా రికార్డులో నమోదైంది.

శ్రీపే
```

## Notes

- **6 variables, in this order.** `sendPaymentReceipt` passes exactly these six.
- The closing line is not decoration: **Meta rejects a body that starts or ends with a
  variable**, and without it the body would end on `{{6}}`.
- Counts are computed *after* the payment is written, so they reflect the new state.
- A **partial** payment still sends a receipt — the money did arrive — but the paid count
  will not have moved, which is correct and not a bug.
- Sending is **fire-and-forget**: a WhatsApp failure logs a warning and never fails the
  payment itself. Recording money must not depend on a messaging API.
- Until `WHATSAPP_RECEIPT_TEMPLATE_NAME` is set the send is skipped silently, so nothing
  breaks before Meta approves the template.

---

# Template 5 — `loan_closed_te`

Sent once, automatically, when the final instalment settles and the loan closes.

## Category

**Utility**

This one needs care. A closure notice is transactional, but anything inviting the borrower
to take another loan makes it **promotional** — Meta would reclassify it as Marketing,
which costs ~6× more and falls under the per-user daily cap. The body below deliberately
ends on the account being closed rather than on an offer.

## Name

```
loan_closed_te
```

## Language

**Telugu**

## Header

**None.** The 🎉 opening the body does the celebrating.

## Body

```
🎉 అభినందనలు {{1}} గారు! 🎉

మీ రుణం #{{2}} పూర్తిగా తీరిపోయింది ✅

చెల్లించిన మొత్తం: *{{3}}*
పూర్తయిన వాయిదాలు: *{{4}}*

రుణాన్ని పూర్తిగా తీర్చినందుకు ధన్యవాదాలు 🙏
మీ ఖాతా ఇప్పుడు పూర్తిగా క్లోజ్ చేయబడింది.
```

## Body sample values

| # | Meaning | Paste this |
|---|---|---|
| `{{1}}` | Borrower name | `సాయి చంద్ర` |
| `{{2}}` | Loan number | `11` |
| `{{3}}` | Total repaid | `62500` |
| `{{4}}` | Instalments completed | `5` |

## Footer

```
శ్రీపే
```

## Finished message preview

```
🎉 అభినందనలు సాయి చంద్ర గారు! 🎉

మీ రుణం #11 పూర్తిగా తీరిపోయింది ✅

చెల్లించిన మొత్తం: 62500
పూర్తయిన వాయిదాలు: 5

రుణాన్ని పూర్తిగా తీర్చినందుకు ధన్యవాదాలు 🙏
మీ ఖాతా ఇప్పుడు పూర్తిగా క్లోజ్ చేయబడింది.

శ్రీపే
```

## Notes

- **4 variables, in this order.** Body neither starts nor ends on a variable.
- Sent **instead of** the receipt when a payment closes the loan, not in addition — two
  messages arriving at once for the same event would read as spam.
- Also fires when the last instalment is **waived**, since that closes the loan too.
- Best-effort like the receipt: a WhatsApp failure never affects the payment record.
- Skipped silently until `WHATSAPP_CLOSED_TEMPLATE_NAME` is set.

---

# Template 6 — `loan_welcome_en` (optional)

Same category, header, sample values, footer and button as above. Submit only if you want
an English variant; switch with `WHATSAPP_TEMPLATE_LANGUAGE=en`.

## Name

```
loan_welcome_en
```

## Body

```
Welcome {{1}} 🙏

Your loan details:

Loan number: {{2}}
Principal amount: ₹{{3}}
Amount you received: ₹{{4}}
Total repayable: ₹{{5}}
Each instalment: ₹{{6}}
Number of instalments: {{7}}
First payment date: {{8}}

Please check the details above are correct, then tap the button below to record your acceptance.
```

## Footer

```
SriPay
```

## Button text

```
Accept
```

---

# Environment variables

```
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_TEMPLATE_LANGUAGE=te

# existing payment reminder template
WHATSAPP_TEMPLATE_NAME=...

# the welcome template created above
WHATSAPP_WELCOME_TEMPLATE_NAME=loan_welcome_te

# the overdue warning created above
WHATSAPP_WARNING_TEMPLATE_NAME=payment_warning_te

# the payment receipt created above
WHATSAPP_RECEIPT_TEMPLATE_NAME=payment_received_te

# the loan closure created above
WHATSAPP_CLOSED_TEMPLATE_NAME=loan_closed_te

# collection account, sent as text and encoded into the QR
UPI_VPA=9553077886sai@ybl

# public URL of the static QR used as the reminder header image
UPI_QR_URL=https://pub-ee792e7de0ab406880a8622ea2af9ad1.r2.dev/static/upi-qr.png

# must match the button's URL prefix — currently http://localhost:3004
APP_URL=https://your-domain
```

---

# Rejection notes

Approval is usually minutes but can take up to 24 hours, and a first-attempt rejection is
common. The usual causes:

- A placeholder with no sample value.
- Body starting or ending with a placeholder.
- Two placeholders adjacent with no text between them.
- Wording that reads as promotional while submitted under Utility.
- A dynamic button URL whose sample does not match the fixed prefix.

A rejected template can be edited and resubmitted, and the name stays reserved. Once
approved, **the body cannot be edited without re-approval**, so check the placeholder
order against the table above before you submit.
