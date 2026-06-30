# Stripe payments setup (Mile 12 Warrior)

This is the site's payment system. The **code is finished**, but checkout is **paused**
(June 2026) while Mile 12 Warrior offers **all training free** and prepares a proper
drivers gear shop. Stripe keys may stay on Railway — checkout stays off until you opt in.

> Note: An older `docs/PAYMENTS-AUTHORIZE-NET-SETUP.md` exists from a previous plan.
> It is **not used** — the site uses **Stripe**. You can ignore the Authorize.net doc.

---

## Current status (paused)

| What | Status |
|------|--------|
| Stripe keys on Railway | May remain set — **not removed** |
| Checkout (`enabled`) | **`false`** until `CHECKOUT_PAUSED=false` |
| Packets & 90-Day Course | **Free** on `/services` and `/course` — no checkout |
| Drivers gear / merch | Browse-only / coming soon — no cart checkout |
| Historical orders & admin Revenue | Unchanged — past paid orders still visible |

To **turn checkout back on** when the gear shop is ready: set Railway variable
`CHECKOUT_PAUSED=false` (and ensure live Stripe keys + webhook are configured).
Redeploy; Buy/Checkout buttons reappear automatically.

---

## How it works (plain English)

1. A shopper adds products to their cart and goes to checkout.
2. They click **Pay securely with card** and are sent to **Stripe's** secure payment page.
3. Card details are entered **on Stripe**, never on our site — so we never see or store card numbers.
4. After paying, Stripe sends them back to their **order receipt** page, and the site:
   - marks the order **paid**,
   - unlocks any **digital downloads / course / packets** they bought,
   - starts the **wellness journal subscription** if they bought it,
   - records shipping for any **physical** items.

The site confirms payment in **two ways** so an order is never "lost":
- a **webhook** from Stripe (the reliable background path), and
- a **return-trip check** when the customer lands back on the receipt page.

---

## What's already built (no developer needed)

| Piece | Where |
|-------|-------|
| Stripe client | `lib/stripe.js` (returns nothing until `STRIPE_SECRET_KEY` is set) |
| Checkout gate | `lib/paymentConfig.js` — checkout paused unless `CHECKOUT_PAUSED=false` and keys exist |
| Is checkout live? | `GET /api/shop/payment-config` → `{ enabled, paused, freeAccess }` |
| Start checkout | `POST /api/stripe/create-checkout-session` (creates the order + Stripe session) |
| Payment webhook | `POST /api/stripe/webhook` (raw body, signature-verified) |
| Return-trip confirm | `POST /api/stripe/confirm` (fallback so orders finish even before the webhook is set up) |
| Receipt / success page | `/shop/order/:id` (already existed) |
| Buy buttons / cart / checkout | `views/shop-product.html`, `views/cart.html`, `views/checkout.html` (auto-appear when `enabled`) |

Prices are always recalculated on the server from the database — the browser cannot change a price.

---

## Railway environment variables

Set these on the Railway service **Variables** tab (production). Never commit real keys to git.

| Variable | Value | Purpose |
|----------|-------|---------|
| `STRIPE_SECRET_KEY` | `sk_live_...` (or `sk_test_...` to test) | Server-only key (may stay set while checkout is paused) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` (or `pk_test_...`) | Safe-for-browser key (optional for hosted checkout). |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From the webhook you create in the Stripe dashboard (see below). |
| `CHECKOUT_PAUSED` | unset or `true` (default) | **`false` = checkout live** when Stripe keys exist |
| `BASE_URL` | `https://mile12warrior.com` | So receipt/cancel links point to the live domain. |

Local placeholders live in `.env.example`. Use Railway only for real values.

---

## ✅ What Joyce needs to do (step by step)

You can do all of this yourself in the Stripe and Railway websites — no coding.

### 1. Create / sign in to your Stripe account
- Go to <https://dashboard.stripe.com> and sign in (or create the Mile 12 Warrior account).
- Finish **business details / bank account** so you can accept real money (Stripe calls this "activate payments"). You can do steps 2–4 in **test mode** first if you want to try it safely.

### 2. Copy your API keys
- In Stripe: **Developers → API keys**.
- Copy the **Publishable key** (`pk_...`) and the **Secret key** (`sk_...`).
  - Test keys start with `pk_test_` / `sk_test_`. Live keys start with `pk_live_` / `sk_live_`.

### 3. Add the keys to Railway
- Open the Railway project **honest-ambition** → service **c-projects-Website** → **Variables**.
- Add:
  - `STRIPE_SECRET_KEY` = your secret key
  - `STRIPE_PUBLISHABLE_KEY` = your publishable key
  - `BASE_URL` = `https://mile12warrior.com` (if it isn't already set)
- Railway will redeploy. Once it's back up **and** `CHECKOUT_PAUSED=false`, checkout buttons appear automatically.

### 4. Set up the payment webhook (so paid orders always complete)
- In Stripe: **Developers → Webhooks → Add endpoint**.
- **Endpoint URL:** `https://mile12warrior.com/api/stripe/webhook`
- **Events to send:** choose **`checkout.session.completed`** (and, if offered, `checkout.session.async_payment_succeeded`).
- Save, then click the new endpoint and copy its **Signing secret** (`whsec_...`).
- Back in Railway **Variables**, add `STRIPE_WEBHOOK_SECRET` = that `whsec_...` value.

### 5. Test it
- Easiest safe test: put **test keys** in Railway (steps 2–4 with `sk_test_`/`pk_test_`), buy any product, and on Stripe's page use test card **4242 4242 4242 4242**, any future expiry, any CVC, any ZIP.
- Confirm: you land on the receipt page showing **Paid**, and (for digital items) the download/course unlocks.
- When happy, swap the test keys for **live keys** and do one small real purchase.

### 6. Going fully live
- Make sure Railway has the **live** `sk_live_`/`pk_live_` keys and the **live-mode** `whsec_` from a webhook created while Stripe is in **live** mode (test and live have separate webhooks/secrets).

That's it — once the keys are in Railway, the store is open.

---

## Notes / decisions baked into the code

- **Subscriptions** (wellness journal) are charged **one month at a time** as a normal payment, matching the existing "one calendar month" plan. The site activates/renews the subscription itself on payment. (True auto-recurring Stripe billing would be a later enhancement and would need Stripe Prices + extra webhook events.)
- **Physical items** make Stripe collect a US shipping address on its page; it's saved to the order.
- If a key is missing or wrong, checkout simply stays off (friendly "opening soon"); it cannot half-charge anyone.
- Card data never touches our server (PCI-light, hosted Checkout).

## Local development (optional)

```bash
# .env (do not commit)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
# For local webhooks, install the Stripe CLI and run:
#   stripe listen --forward-to localhost:3000/api/stripe/webhook
# then use the printed whsec_... as STRIPE_WEBHOOK_SECRET
```

Run `npm install` then `npm start`, open <http://localhost:3000/shop>, and test with Stripe test cards.
