# Stripe payments setup (Mile 12 Warrior)

Checkout is **not enabled yet**. This doc covers env vars and the recommended path before you turn on payments.

## If test keys were exposed in chat

1. Open [Stripe Dashboard - Developers - API keys](https://dashboard.stripe.com/test/apikeys).
2. **Roll / rotate** the **secret** key (`sk_test_...`). Treat the old key as compromised.
3. Update Railway variables with the new keys (never commit real keys to git).

## Railway environment variables

Set these on your Railway service (Variables tab):

| Variable | Purpose |
|----------|---------|
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` - safe for browser if you add Checkout later |
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` - server only, used by `lib/stripe.js` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` - after you add a webhook endpoint (later) |

Copy placeholders from `.env.example` locally; use Railway for production values.

## Recommended integration: Hosted Checkout

- **Simplest PCI scope**: card data stays on Stripe hosted page.
- Flow (when implemented): create a Checkout Session on the server, redirect customer, Stripe webhook confirms `checkout.session.completed`, set `orders.payment_status = paid` and run fulfillment.
- Do **not** store raw card numbers on your server.

## Local webhooks (optional)

Install [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward events to `http://localhost:3000/api/stripe/webhook` (endpoint to be added with checkout).

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the signing secret Stripe CLI prints as `STRIPE_WEBHOOK_SECRET` locally.

## npm dependency

The app includes the official [stripe](https://www.npmjs.com/package/stripe) package. `lib/stripe.js` exports a client when `STRIPE_SECRET_KEY` is set, or `null` otherwise so the server starts without Stripe configured.

## Admin orders until Stripe is live

Admins can update order status via the dashboard API. To mark an order as paid and grant digital access, use `mark_paid: true` and `confirm_fulfillment: true` only after you have verified payment (manual, Stripe Dashboard, or future webhook).

## Cursor / AI helpers

Stripe docs and optional Cursor Stripe skills are helpful but **not required** - Hosted Checkout + webhooks is enough for most shops.