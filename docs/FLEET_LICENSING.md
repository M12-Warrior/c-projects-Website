# Fleet Packet Per-Yard Licensing

Plain-language design + implementation notes for the Mile 12 Warrior "Fleet packet"
products. Written for Joyce (owner/admin) plus future developers.

## The problem we are solving

A "Fleet packet" (Fleet New Hire Orientation, Fleet Refresher, the Fleet Bundle, and
the Complete Bundle which includes them) is sold per **yard / terminal**, not per
company. A large carrier with several yards should buy one packet **per yard** — they
should not be able to buy a single $79 packet and print it for every yard in the
fleet. Access is good for **1 year**, after which it must be renewed.

To make this real we need to:

1. Capture a little bit of fleet info at purchase (who they are, which yard this is).
2. Tie each purchased packet to **one specific yard** (a terminal number or a physical
   address — whatever that fleet uses to tell its yards apart).
3. Track the 1-year clock, show it in the admin page, and let Joyce adjust / renew it.
4. Block downloads once a license is expired or revoked.
5. Stamp the downloaded material with the company + yard so a printed packet is
   visibly tied to one yard (anti-abuse).

## How the existing system works (verified in code)

- **Products** live in the `products` table (seeded in `db/database.js`). Fleet packets
  are `category = 'digital'`: `fleet-new-hire-packet` ($79), `fleet-refresher-packet`
  ($79), `fleet-bundle` ($129), and `complete-bundle` ($249).
- **Access is granted** through the `product_access_grants` table. When an order is paid
  and fulfilled, `createProductAccessGrantsForOrder(orderId)` in `routes/shop.js` reads a
  `DIGITAL_GRANT_MAP` and inserts one grant row per entitled packet. Fleet packets get
  `expires_at = purchase + 12 months`; individual packets get a per-account download cap.
  This runs from both the Stripe finalize path (`routes/stripe.js`) and the admin
  order-update path — it is idempotent (skips if grants already exist for the order).
- **Downloads are authorized** by `GET /api/shop/packet-access?type=...`, which checks for
  a matching, non-expired grant, and `POST /api/shop/packet-download-log`, which records a
  download. The packets themselves are generated **client-side** as HTML in
  `public/js/packets.js` (no static PDF on the server). This matters: it means stamping
  the yard identifier into the packet is easy and free.
- **Accounts**: `users` table + sessions. Orders link to a user via `orders.user_id`.
- **Checkout**: cart (localStorage) -> `/shop/checkout` -> `POST /api/stripe/create-checkout-session`
  builds a pending order and redirects to Stripe Hosted Checkout. Stripe collects card +
  (for physical items) shipping. **Online checkout is OFF in production** (placeholder
  Stripe keys), so this is safe to extend.
- **Admin** (`views/admin.html`) already has a "Packets & Renewals" tab backed by
  `GET /api/admin/packets-renewals`.

## Data model (what we added)

We extended the existing model rather than replacing it, so the proven download-auth path
keeps working.

### New table: `fleets` (company level)

| column | meaning |
| --- | --- |
| `id` | primary key |
| `user_id` | the purchasing account |
| `company_name` | fleet / carrier name |
| `contact_name`, `contact_email`, `contact_phone` | who to reach |
| `num_yards` | optional: how many yards they run (planning/sales signal) |
| `notes` | admin notes |
| `created_at`, `updated_at` | timestamps |

### Extended: `product_access_grants` (now also a per-yard license)

Each fleet-packet grant **is** one yard license. New columns (idempotent `ALTER`):

| column | meaning |
| --- | --- |
| `fleet_id` | links the license to a `fleets` row |
| `yard_identifier` | the fleet's own identifier for this yard: **terminal # OR physical address** |
| `yard_label` | optional friendly name ("West Sac Yard") |
| `status` | `active` or `revoked` (expiry is still driven by `expires_at`) |
| `revoked_at` | when it was revoked |

### Extended: `orders` (capture at checkout)

New columns (idempotent `ALTER`) so the info entered at checkout is persisted and then
copied onto the grant when access is granted: `fleet_company`, `fleet_contact_name`,
`fleet_contact_email`, `fleet_contact_phone`, `fleet_num_yards`, `yard_identifier`,
`yard_label`.

## The minimal signup questionnaire (kept short on purpose)

Shown on the checkout page **only when the cart contains a fleet packet**:

1. **Company / fleet name** (required)
2. **This yard's identifier** (required) — a single field that accepts a **terminal
   number or a physical address**, plus a radio to say which it is.
3. **Contact name** (required) and **contact email** (defaults to the account email).
4. **How many yards does your fleet have?** (optional — helps Joyce upsell multi-yard).

That's it — four short fields, one optional. Nothing that discourages a buyer.

## How 1-year expiry is tracked and enforced

- On fulfillment, fleet-packet grants get `expires_at = now + 12 months` (existing logic).
- `GET /api/shop/packet-access` and `POST /api/shop/packet-download-log` only allow grants
  where `expires_at IS NULL OR expires_at > now` **and** `status != 'revoked'`. Expired or
  revoked -> download blocked.
- Admin can see purchase date, expiry, days remaining, and status, and can **renew**
  (+12 months), **edit** the expiry/yard, or **revoke**.

## Enforcement options for tying downloads to a yard

**Option (a) — Entitlement-bound access.** Downloads are gated to the logged-in account's
active, non-expired, non-revoked grant, and each grant is bound to exactly one yard.
*Pros:* simple, already most of the way there. *Cons:* on its own it does not stop someone
re-using the same login to print for several yards.

**Option (b) — Per-yard stamping (watermark).** Because packets are generated as HTML in
the browser, we stamp the company name + yard identifier + "valid through" date into a
banner at the top and a footer on the generated/printed packet. *Pros:* every printed
sheet is visibly tied to ONE yard, which is a strong, cheap deterrent; no PDF tooling
needed. *Cons:* visual/contractual deterrent, not a hard cryptographic lock.

**Option (c) — Download-count limits.** Cap the number of downloads per license. *Pros:*
limits volume. *Cons:* fights the legitimate "unlimited distribution **within one yard**"
promise; annoying for big yards.

### Recommendation (implemented): (a) + (b)

Entitlement-bound access **plus** per-yard stamping. It directly delivers the owner's goal
("specific information that ties them to that yard so they don't print endless sheets to
cover all yards") while preserving unlimited printing *within* the licensed yard. Both are
low-risk and fully reversible. We did **not** impose a download cap on fleet packets (that
would conflict with the per-yard unlimited-distribution promise) — `max_downloads` stays
available if Joyce ever wants it.

## What is implemented vs. deferred

**Implemented now (safe foundation):**
- Data model + idempotent migrations.
- Fleet/yard capture at checkout, persisted on the order.
- Fleet record + per-yard binding created automatically when access is granted (both the
  Stripe finalize path and the admin "mark paid / fulfill" path).
- 1-year expiry calculation + storage (existing) + `status` (active/revoked) enforcement.
- Download gating + per-yard stamping in the packet generator.
- Admin "Fleets & Yard Licenses" management: list, edit yard/expiry, renew (+1yr), revoke,
  and manually add a yard license.

**Deferred / pending Joyce's confirmation:**
- Exact wording of the checkout questions.
- Whether a fleet buying for several yards in one transaction should be forced to enter
  each yard up front (current approach: one yard per purchase; extra yards are added by
  re-purchasing or by Joyce in admin).
- Automated renewal reminder emails (currently the admin "Send reminder" records an audit
  trail; real email needs SMTP wiring).
- Hard cryptographic per-yard locking / PDF DRM (not recommended; high cost, low value vs.
  the stamping deterrent).

## Decisions for Joyce to confirm

1. **Signup questions** — confirm the four fields above are right (add/remove any?).
2. **How a yard is identified** — terminal number, physical address, or "either" (we built
   "either"). Confirm.
3. **Watermark/stamp** — OK to print company + yard + expiry on the packets? (Recommended.)
4. **Renewal** — renew = +12 months from today (default) or from the old expiry? Should an
   expired packet still be downloadable for a short grace period? (Currently: hard stop at
   expiry; admin renews on request.)
5. **Multi-yard purchases** — is "one packet = one yard, buy again for more yards" the
   rule? (That is what protects packet pricing.)
