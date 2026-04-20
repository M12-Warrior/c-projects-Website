---
name: Authorize.net Payments and Receipts
overview: Prepare the site for online payments via Authorize.net (card and optional digital wallets), add email and optional SMS receipt delivery, and ensure digital content is released according to per-product rules already in place (with any admin-configurable extensions you choose).
todos: []
isProject: false
---

# Authorize.net Payments, Receipts, and Digital Release

## Current state (from codebase)

- **Checkout:** [views/checkout.html](views/checkout.html) has shipping form and "Place Order"; `PAYMENT_COMING_SOON = true` so orders are created without payment.
- **Orders API:** [routes/shop.js](routes/shop.js) `POST /api/shop/orders` accepts `items` and `shipping`, creates order with status `pending`, and does not charge a card. No payment nonce or receipt preference yet.
- **Digital release:** Same file uses a hardcoded `DIGITAL_GRANT_MAP` (product_slug → grants with `expiresInMonths`, `max_downloads`). Grants are created when order status becomes `completed` or `paid` (admin today; after payment we will trigger on successful charge). Only products with `category === 'digital'` get grants.
- **Receipts:** No order receipt emails or SMS today. [routes/auth.js](routes/auth.js) and [routes/blog.js](routes/blog.js) use nodemailer (SMTP) for password reset and comment notifications; no SMS provider yet.
- **Docs:** [docs/PAYMENTS-AUTHORIZE-NET-SETUP.md](docs/PAYMENTS-AUTHORIZE-NET-SETUP.md) already describes Authorize.net credentials, Accept.js, and the flow (nonce → charge → create order + grants).

"Services" in your message is treated as the same shop/checkout flow (packets, course, merchandise, and any services you sell as products); Authorize.net will be used for all of them unless you specify a different scope.

---

## Implementation summary

1. **Authorize.net (card payments)**
  - Add Accept.js to checkout; collect card (and optionally Apple/Google Pay) and get a payment nonce.  
  - Extend `POST /api/shop/orders` to require a payment nonce when payments are enabled, call Authorize.net to charge, then create order with status `completed` (or `paid`) and create product access grants so digital content is released immediately per existing `DIGITAL_GRANT_MAP` (and any future per-product rules).  
  - Remove/hide "Payment coming soon" once live.
2. **Receipt delivery (email and optional SMS)**
  - Add receipt preference at checkout: **Email**, **SMS**, or **Both**.  
  - Store preference on the order (new column e.g. `receipt_via`: `email` | `sms` | `both`).  
  - After a successful payment (and order creation), send:  
    - **Email receipt:** Using existing nodemailer (SMTP) with order summary and, for digital items, a short “your access” blurb and link.  
    - **SMS receipt:** Only if you provide an SMS provider (e.g. Twilio); send a short summary + link.
  - Email can use the logged-in user’s email; SMS requires a phone number (user profile and/or optional field at checkout).
3. **Digital content release “as per set up on each product”**
  - Today, release rules are in code: `DIGITAL_GRANT_MAP` in [routes/shop.js](routes/shop.js) (e.g. course-90day, packets, fleet licenses, expiry, max_downloads).  
  - **Option A (recommended for first phase):** Keep using this map; no DB changes. Digital content is released automatically when the order is set to `completed`/`paid` after successful charge, with existing limitations (expiry, download caps) enforced.  
  - **Option B (later):** Add per-product fields in admin (e.g. “digital”, “expires_in_months”, “max_downloads”) and drive grant creation from DB instead of a single hardcoded map. This requires schema changes and admin UI.

---

## Information you need to provide

- **Authorize.net credentials (from Chase/Authorize.net)**  
  - API Login ID  
  - Transaction Key  
  - Public Client Key (create in Merchant Interface → Account → Settings → Security Settings → Manage Public Client Key)  
  - Use **Sandbox** values first; production when going live.
- **Environment variables (already documented in [docs/PAYMENTS-AUTHORIZE-NET-SETUP.md](docs/PAYMENTS-AUTHORIZE-NET-SETUP.md))**  
  - `AUTHORIZE_NET_API_LOGIN_ID`  
  - `AUTHORIZE_NET_TRANSACTION_KEY`  
  - `AUTHORIZE_NET_PUBLIC_CLIENT_KEY`  
  - `AUTHORIZE_NET_ENVIRONMENT` = `sandbox` or `production`
- **Email (receipts)**  
  - Confirm SMTP is already set (e.g. `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`) so we can reuse it for order receipts.  
  - If not, provide SMTP details or the service you want to use.
- **SMS (optional)**  
  - Whether you want SMS receipts at all.  
  - If yes: which provider (e.g. Twilio) and whether you already have an account.  
  - Twilio would require: Account SID, Auth Token, and a Twilio phone number (for sending).  
  - Where to get the phone number: user profile (new field) and/or optional at checkout.
- **Receipt content**  
  - Any required legal or branding text (e.g. “Mile 12 Warrior LLC”, address, refund policy link) to include on email and SMS receipts.  
  - Base URL of the site (e.g. `https://yoursite.com`) for “view order” links in receipts.

---

## Questions you need to answer or research

1. **Authorize.net account**
  - Do you already have a Chase/Authorize.net merchant account, or is it still in progress?  
  - Do you have both Sandbox and Production credentials, or only one? (We need Sandbox for testing before going live.)
2. **Receipt preference**
  - Should receipt choice be **required** (customer must pick Email, SMS, or Both) or **optional** (default to email if they don’t choose)?  
  - For “Both”, send one email and one SMS, or only one channel based on another rule?
3. **SMS**
  - Do you want SMS receipts in the first release? If yes, which provider (Twilio, etc.) and do you have (or will you create) an account?  
  - Should we collect phone only at checkout for receipts, or also add a “phone” field to user registration/profile and use it when available?
4. **Digital product rules**
  - Are the **current** rules in code (per product slug: expiry, max downloads, which slugs get which grants) sufficient for “digital content released as per set up on each product,” or do you need to **configure these per product in the admin** (Option B)? If admin-configurable, we’ll need to define the fields (e.g. “is digital”, “expires in months”, “max downloads”) and whether they apply to new products only or existing ones too.
5. **Order status and refunds**
  - After successful charge, should the order be set to `completed` or `paid`? (Code already treats both as “create grants.”)  
  - For refunds: will you handle them in the Authorize.net dashboard and then manually mark orders in admin, or do you want a “Refund” action in admin that calls Authorize.net’s refund API and updates the order?
6. **Tax and billing**
  - Do you need sales tax calculated at checkout (e.g. by state)? If yes, which solution (e.g. TaxJar, manual rates, or “tax not in scope for now”)?
7. **Apple Pay / Google Pay**
  - Do you want digital wallets in the first release or add them after card-only is live? (Authorize.net supports them; Apple Pay needs domain verification in the Authorize.net dashboard.)
8. **“Services” scope**
  - Confirm: should **all** shop products (packets, course, merchandise, and any service products) use this same checkout and Authorize.net, or only a subset (e.g. only “Services” category)?

---

## Suggested order of work (after you provide answers)

1. Integrate Authorize.net (Accept.js + server charge), then create order with status `completed`/`paid` and create grants so digital content is released with current limitations.
2. Add receipt preference (email/sms/both) to checkout and order; implement email receipts via existing SMTP.
3. If SMS is in scope, add phone collection and Twilio (or chosen provider), then SMS receipt.
4. If you need per-product digital rules in admin, add schema and admin UI, then switch grant logic from `DIGITAL_GRANT_MAP` to DB-driven rules.

Once you have the credentials and the answers above, implementation can proceed in that order.