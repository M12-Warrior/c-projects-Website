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
`yard_label`, and **`fleet_yards_json`** (a list `[{ slug, yardIdentifier, yardLabel }]`,
one entry per fleet-packet unit, used for multi-yard purchases).

### New table: `replacement_requests`

A licensed fleet asking for a fresh copy of a yard they already hold (lost/damaged):
`id`, `user_id`, `fleet_id`, `grant_id`, `product_slug`, `yard_identifier`, `yard_label`,
`note`, `status` (`open`/`resolved`), `created_at`, `resolved_at`.

## The signup questionnaire (kept short on purpose)

Shown on the checkout page **only when the cart contains a fleet packet**:

1. **Company / fleet name** (required)
2. **Contact name** (required) and **contact email** (defaults to the account email).
3. **Yards in your whole fleet?** (optional — helps Joyce see multi-yard potential).
4. **Per-yard identifier(s)** (required) — the checkout renders **one identifier field per
   fleet packet being purchased** (driven by the cart quantity). Each accepts a **terminal
   number or a physical address**, plus an optional yard nickname.

### Multi-yard purchases (one packet = one yard)

The number of fleet packets in the cart drives how many yard identifiers are required:
buying 5 fleet packets in one order asks for 5 distinct yard identifiers, and the order
creates **one yard-bound license/grant per yard**, each with its own +12-month term, all
tied to the same fleet. Bundles bind both packets to the same yard. A single-yard purchase
keeps the original minimal one-yard capture. Grant creation reads `fleet_yards_json`, mints
one license per yard, and stays idempotent (re-running never duplicates). Account-level
extras in `complete-bundle` (course, individual packets) are granted once, not per yard.

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
the browser, we stamp the company name + yard identifier + "valid through" date onto the
packet: a prominent banner on the first page **plus a compact running header and footer
that repeat on EVERY page** of the printed/PDF output (via `position: fixed` elements,
which browsers repeat per printed page). *Pros:* every printed sheet is visibly tied to
ONE yard, which is a strong, cheap deterrent; no PDF tooling needed. *Cons:*
visual/contractual deterrent, not a hard cryptographic lock.

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

## Replacement packets (lost / damaged)

A fleet that already holds an **active, in-date** license for a yard can request a fresh
copy from the Services page ("Lost or damaged? Request a replacement"). This is for
replacements only — not a new purchase. Implementation (chosen for "works today, no new
infrastructure"):

- `POST /api/shop/request-replacement` verifies the user holds an active, non-expired,
  non-revoked license for that packet, then records a row in `replacement_requests` **and**
  drops a note in the admin **Messages** inbox.
- The request shows at the top of the admin **Fleets & Yards** panel with a "Mark handled"
  button (`POST /api/admin/replacement-requests/:id/resolve`).
- A **`mailto:` fallback** (prefilled with the fleet/yard info) is shown if the request
  cannot be recorded, so the customer can always reach Joyce.

No SMTP is required: requests reach Joyce inside the admin dashboard. (Customers can also
simply re-download anytime — downloads are unlimited within a licensed yard.)

## What is implemented vs. deferred

**Implemented now:**
- Data model + idempotent migrations (incl. `fleet_yards_json`, `replacement_requests`).
- Fleet/yard capture at checkout, persisted on the order.
- **Multi-yard purchases:** one identifier field per fleet packet bought, one yard-bound
  license per yard (each +12 months), all tied to the fleet; idempotent.
- Fleet record + per-yard binding created automatically when access is granted (both the
  Stripe finalize path and the admin "mark paid / fulfill" path).
- 1-year expiry calculation + storage + `status` (active/revoked) enforcement.
- Download gating + per-yard stamping **on every page** of the packet.
- Admin "Fleets & Yard Licenses" management: list, edit yard/expiry, renew (+1yr), revoke,
  add a yard license, and handle replacement requests.
- Replacement-request flow (records + Messages inbox + mailto fallback).

**Deferred / pending Joyce's confirmation:**
- Automated renewal/replacement emails (currently surfaced in the admin dashboard; real
  outbound email needs SMTP wiring — `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` on Railway).
- Hard cryptographic per-yard locking / PDF DRM (not recommended; high cost, low value vs.
  the stamping deterrent).

## Decisions for Joyce (confirmed defaults)

These were reviewed and **confirmed** — no change needed:
1. Yard identified by **either** a terminal number or a physical address.
2. **Stamp** company + yard + "valid through" on packets — yes (now on every page).
3. Expiry = **hard stop** at 1 year; renew on request (admin renews, +12 months).
4. **One master packet per yard**, unlimited driver sign-off sheets within that yard.
5. **Multi-yard = one packet per yard**, captured per yard at checkout.

Still optional (Joyce's call later): wire SMTP if she wants automatic renewal/replacement
emails instead of handling requests in the admin dashboard.
