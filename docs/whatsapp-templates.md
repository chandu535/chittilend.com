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
చిట్టిలెండ్
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

# Template 2 — `loan_welcome_en` (optional)

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
ChittiLend
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
