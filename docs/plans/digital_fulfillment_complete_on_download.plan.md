---
name: Digital fulfillment — complete on download
overview: For orders that contain only digital deliverables, move customer-facing fulfillment from “processing” to “complete” once they have downloaded (or otherwise accessed) the purchased content. Physical or mixed carts keep the existing processing → shipped workflow.
todos:
  - id: product-rules
    content: "Define which order shapes qualify: digital-only (all line items category digital / no ship-to physical SKU); mixed cart behavior (e.g. digital line complete on download, order stays processing until physical ships)"
    status: pending
  - id: download-signal
    content: "Use existing hooks: POST /api/shop/packet-download-log increments product_access_grants.download_count; add/join journal PDF or course access signals if those paths do not hit the same endpoint"
    status: pending
  - id: order-status-update
    content: "On first qualifying download for a digital-only order, set orders.status (or a dedicated fulfillment field) to completed; ensure idempotent (one transition)"
    status: pending
  - id: ui-copy
    content: "Update purchase log, receipt (shop-order.html), and account.html fulfillment text so “complete” matches the new rule; keep physical messaging unchanged"
    status: pending
  - id: admin-visibility
    content: "Optional: admin order list shows digital-complete vs shipped for mixed orders"
    status: pending
isProject: false
---

# Digital-only orders — show complete after download

## Goal

Today, paid orders can show **PAID** + **PROCESSING** with copy about preparing shipment or finishing digital setup. For **digital-only** purchases, the business wants the customer to see **complete** once they have **downloaded** the product (or equivalent first access), not left indefinitely in processing.

## Current building blocks (repo)

- **`product_access_grants`** — `download_count`, `max_downloads`, tied to `order_id` and `product_slug` ([`db/database.js`](c:/Projects/Website/db/database.js)).
- **Packet downloads** — [`POST /api/shop/packet-download-log`](c:/Projects/Website/routes/shop.js) increments `download_count` when a permitted packet download is logged.
- **Order APIs and receipt** — [`GET /api/shop/orders/:id`](c:/Projects/Website/routes/shop.js), [`views/shop-order.html`](c:/Projects/Website/views/shop-order.html), purchase log on account/profile as applicable.

## Design decisions (to confirm before coding)

1. **Trigger:** First logged download that consumes access (e.g. first `packet-download-log` success for that order’s grants), vs any “view in browser” for course-only SKUs.
2. **Mixed cart:** If an order has both a kit (physical) and a digital packet, either keep order **processing** until physical ships, or show **per-line** status in UI (harder).
3. **Subscriptions (e.g. journal):** Use the dedicated rule in [`wellness_journal_monthly_downloads_and_reminders.plan.md`](wellness_journal_monthly_downloads_and_reminders.plan.md): order becomes **complete** (customer + admin) when the **last recorded/paid month** for that order is downloaded—not necessarily the same trigger as one-shot digital SKUs.

## Out of scope for this plan doc

Guest-site audit items you are tracking separately; this file is only the digital fulfillment rule for a future implementation pass.
