# Payment setup: Authorize.net (Chase / Visa solution)

This guide prepares you to accept payments for **packets, services, course, and merchandise** using **Authorize.net** (via your Chase agreement). Once your credentials arrive in the mail, you can complete the steps below and go live.

---

## What you’ll receive (or need to obtain)

From **Chase / Authorize.net** you typically get or create:

| Item | What it is | Where to get it |
|------|------------|------------------|
| **API Login ID** | Username for API calls | Letter from Chase/Authorize.net, or Merchant Interface → Account → API Credentials & Keys |
| **Transaction Key** | Secret key for server-side API calls | Same as above; you may need to generate it in the Merchant Interface |
| **Public Client Key** | Used by Accept.js in the browser (card never touches your server) | Merchant Interface → Account → Settings → Security Settings → **Manage Public Client Key** — create one for Sandbox and one for Production |
| **Merchant ID** (optional) | For some reporting / Apple Pay | May be in your welcome pack or Account settings |

You will have **two environments**:

- **Sandbox (test):** For testing with test card numbers; no real money.
- **Production (live):** Real transactions. Use production credentials only after testing.

---

## Payment methods (what Authorize.net supports)

- **Credit / debit cards** — Via **Accept.js**: customer enters card on your site; browser sends data to Authorize.net; you get a one-time “payment nonce” and charge it on your server. Card data never hits your server (PCI-friendly).
- **Apple Pay** — Supported by Authorize.net (digital wallets). Requires extra setup (merchant domain verification, etc.) in the Authorize.net dashboard and in your front-end.
- **Google Pay** — Similarly supported; implementation details are in Authorize.net’s developer docs.
- **PayPal** — Not part of core Authorize.net. If you need PayPal, it’s usually a separate integration (e.g. PayPal Checkout). We can add it later if you want.

So: **direct CC, Apple Pay, and Google Pay** are in scope with Authorize.net; **PayPal** is a separate “when we’re ready” step.

---

## Environment variables (do not commit these)

When the mail arrives, add these to your **Railway** project (or your server’s environment). Use **Sandbox** values first; switch to **Production** when you go live.

```bash
# Authorize.net — Sandbox (testing)
AUTHORIZE_NET_API_LOGIN_ID=your_sandbox_api_login_id
AUTHORIZE_NET_TRANSACTION_KEY=your_sandbox_transaction_key
AUTHORIZE_NET_PUBLIC_CLIENT_KEY=your_sandbox_public_client_key
AUTHORIZE_NET_ENVIRONMENT=sandbox

# When going live, switch to production values and set:
# AUTHORIZE_NET_ENVIRONMENT=production
```

- **API Login ID** and **Transaction Key** → from letter or Merchant Interface.
- **Public Client Key** → create in Merchant Interface (Security Settings → Manage Public Client Key); one for sandbox, one for production.
- **AUTHORIZE_NET_ENVIRONMENT** → `sandbox` or `production`.

---

## How the site will work (high level)

1. **Checkout page**  
   Customer enters shipping (already there) and payment:
   - **Option A:** Card fields on your site → your page loads **Accept.js**, sends card data to Authorize.net, gets back a **payment nonce**.
   - **Option B:** “Pay with Apple Pay” / “Pay with Google Pay” buttons → same idea: Accept.js / digital wallet returns a nonce.

2. **Place Order**  
   When the user clicks “Place Order”:
   - Front-end sends: cart items, shipping, and **payment nonce** (never the real card number).
   - Back-end: calls Authorize.net **createTransactionRequest** with the nonce and amount; if the charge succeeds → create the order in your DB with status `completed` (or `paid`) and create **product access grants** for digital items; then return success.
   - If the charge fails → return an error and do **not** create the order.

3. **Digital access**  
   Your existing logic already creates `product_access_grants` when an order is set to `completed`/`paid`, so no change needed there once the order is created after a successful charge.

---

## What we will add to the codebase (when credentials are ready)

| Area | Change |
|------|--------|
| **Dependencies** | `authorizenet` (official Node SDK) or direct REST calls to Authorize.net API. |
| **Env** | Read `AUTHORIZE_NET_*` and `AUTHORIZE_NET_ENVIRONMENT`; use sandbox vs production endpoint. |
| **Checkout page** | Load Accept.js (script from Authorize.net); add card form (or hosted form); optional Apple Pay / Google Pay buttons; on submit, get nonce and send with order. |
| **API** | New route, e.g. `POST /api/shop/orders` (or `POST /api/shop/checkout`): validate cart, validate nonce, call Authorize.net to charge; on success create order + grants and return order id; on failure return error. |
| **Banners / copy** | Remove “Online payment coming soon”; optionally add “Secure payment by Authorize.net” or similar. |

No card data will be stored on your server; only the nonce is sent from the browser to your API, then your server uses it once with Authorize.net.

---

## When the information arrives — checklist

1. **Open the envelope**  
   Note: API Login ID, Transaction Key, and whether they’re for Sandbox or Production.

2. **Log in to the Merchant Interface**  
   - Sandbox: https://sandbox.authorize.net  
   - Production: https://account.authorize.net  
   Use the login from Chase/Authorize.net.

3. **Create or copy the Public Client Key**  
   Account → Settings → Security Settings → **Manage Public Client Key**.  
   Create one for Sandbox and one for Production. You’ll need the **Public Client Key** in the front-end (Accept.js).

4. **Add environment variables**  
   In Railway (or your host): add `AUTHORIZE_NET_API_LOGIN_ID`, `AUTHORIZE_NET_TRANSACTION_KEY`, `AUTHORIZE_NET_PUBLIC_CLIENT_KEY`, and `AUTHORIZE_NET_ENVIRONMENT=sandbox`.  
   Use **Sandbox** credentials first.

5. **Tell your developer (or follow the implementation doc)**  
   “Credentials are in; environment variables are set.” Then we can:
   - Add the payment route and Accept.js integration.
   - Run a test transaction in Sandbox (test card numbers are in the Authorize.net docs).
   - Switch to production credentials and `AUTHORIZE_NET_ENVIRONMENT=production` when you’re ready to go live.

6. **Optional: Apple Pay / Google Pay**  
   After basic card payments work, we can add digital wallets (may require domain verification and extra setup in the Authorize.net dashboard).

7. **Optional: PayPal**  
   Separate integration; can be added later if you want it.

---

## Test card numbers (Sandbox only)

Authorize.net provides test card numbers for Sandbox. Examples (confirm in their latest docs):

- **Visa:** `4111111111111111`
- **Mastercard:** `5424000000000015`
- Use a future expiry (e.g. 12/28) and any valid CVV (e.g. 123).

Never use these in production.

---

## Security reminders

- **Never** commit API Login ID, Transaction Key, or Public Client Key to Git. Use environment variables only.
- **Public Client Key** is safe to use in browser JavaScript; it’s meant for Accept.js.
- **Transaction Key** must only be used on the server (Node). Keep it in env vars on Railway (or your server).
- Run the live site over **HTTPS** (you already do on Railway).

---

## Where things live in this project

| What | Where |
|------|--------|
| Checkout page (shipping + future payment form) | `views/checkout.html` |
| Create order API (today: no payment; later: charge then create order) | `routes/shop.js` → `POST /api/shop/orders` |
| Order confirmation + digital access blurb | Same checkout page (already shows “Your digital access” after order) |
| Product access grants (created when order is completed/paid) | `routes/shop.js` (createProductAccessGrantsForOrder) |
| “Payment coming soon” banner | `views/checkout.html`, `views/cart.html`, `views/shop.html` |

When we add payment, we’ll:

- Keep the same order-creation and grant logic; we’ll only add a step before it: “charge via Authorize.net with nonce; if success, then create order and grants.”
- Add a payment section to the checkout form and wire Accept.js.
- Remove or hide the “payment coming soon” messaging once live.

---

## Quick reference — Authorize.net links

- **Sandbox login:** https://sandbox.authorize.net  
- **Production login:** https://account.authorize.net  
- **Developer docs (Accept.js):** https://developer.authorize.net/api/reference/features/acceptjs.html  
- **Node SDK (optional):** https://github.com/AuthorizeNet/sdk-node  

When your credentials arrive, add them to env, then we can finish the integration and turn on payments for packets, services, course, and merchandise.
