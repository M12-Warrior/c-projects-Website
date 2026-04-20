---
name: Wellness Journal — monthly downloads, tracker, reminders
overview: Month-by-month journal delivery—calendar PDFs, per-month download counts, renew-by-the-1st copy, 12-month horizon, optional half-price first month if purchase after the 15th, billing aligned to the 1st after signup, final-month reminders, order complete when last paid month downloaded.
todos:
  - id: clarify-12-month-rule
    content: "Resolved: 12-month cycle starts in the calendar month of purchase (purchase can be anytime); ‘month 1’ = that month"
    status: completed
  - id: schema-monthly-downloads
    content: "Persist per-user per calendar month (YYYY-MM) download counts and/or ‘month fully exported’ flags; tie to subscription period and orders where needed"
    status: pending
  - id: journal-print-calendar
    content: "Journal PDF/print captures current month/date/year; monthly view scoped to subscription month being downloaded"
    status: pending
  - id: ui-download-counter
    content: "Show downloads used this month vs policy (and short copy to download the whole month)"
    status: pending
  - id: copy-renew-by-first
    content: "Invite return on or before the 1st to purchase and download the next month; consistent on journal, print, account"
    status: pending
  - id: tracker-final-month-reminder
    content: "When last month of current purchase block is fully downloaded, surface reminder to continue before next month starts"
    status: pending
  - id: order-complete-last-month-downloaded
    content: "When last recorded/paid month for that order is downloaded, set orders.status to completed (or equivalent) — same value in customer receipt/purchase log and admin order list/detail"
    status: pending
  - id: half-price-after-15th
    content: "First-time journal monthly purchase: if checkout date is day 16–last day of month, charge 50% of list price; show clear line item/reason; server must recompute—never trust client total alone"
    status: pending
  - id: renewals-align-first
    content: "After initial purchase, align subscription period / next charge date to 1st of month (see Decision 7); update activateWellnessSubscription or successor logic"
    status: pending
isProject: false
---

# Wellness Journal — monthly downloads, tracker, reminders

## Context (existing code)

- **Subscription:** [`routes/subscription.js`](c:/Projects/Website/routes/subscription.js) — `wellness_journal` plan, `activateWellnessSubscription` extends `current_period_end` monthly.
- **Online journal:** [`routes/journal.js`](c:/Projects/Website/routes/journal.js) — `subscriber_journal_entries` by `entry_date`.
- **Account hub:** [`routes/account.js`](c:/Projects/Website/routes/account.js) — links to `/journal` and `/journal/print`.

There is **no** per–calendar-month download counter or “last month of bundle” tracker yet; this plan defines what to build.

---

## DECISIONS (product)

### 1. Calendar on the journal

- The journal experience (including **PDF / print**) should reflect the **current calendar month, date, and year** where it matters for the customer-facing artifact.
- Month-by-month purchases align with **calendar months** for messaging (“this month’s journal,” “next month starting the 1st”).

### 2. Month-by-month downloads

- Because purchase is **month by month**, show **how many downloads they have done for that month** (the active subscription month), not a single lifetime count for the journal.
- **Advise** customers to **download the whole month** (full-month PDF or equivalent) so they have a complete record offline.

### 3. Renew by the 1st

- **Invite them back on the 1st or before the 1st** to **purchase and download** the next month’s journal—so the habit stays clear and they don’t miss a month at the boundary.

### 4. Twelve-month window (resolved)

- A journal can be **purchased at any time**; the **12-month cycle begins with the calendar month in which they purchase** (not January–December of a fixed year).
- **Month 1** of the twelve is **that purchase month**; counting through **twelve consecutive calendar months** from there for entitlement, tracking, and “where you are” in the cycle (implementation: store anchor `YYYY-MM` or equivalent per subscriber).

### 5. Tracker and “final month” reminder

- Maintain a **tracker** over their purchased months.
- When they **complete the download** of the **final month** covered by their **current purchase** (e.g. last month of a prepaid block or current subscription period), show a **reminder** and **invite them to continue their journal journey** **before the next calendar month arrives** (so they can renew seamlessly).

### 6. Order complete when last paid month is downloaded

- Once the **last recorded / paid month** tied to that **order** is **downloaded** (per the agreed definition of “download” for the journal), **mark that order complete** everywhere:
  - **Customer:** purchase log, receipt, and any fulfillment chip should show **complete** (not processing) for that order.
  - **Admin:** the same order should show **complete** in the admin order list and order detail.
- Implementation should use **one source of truth** on the order row (e.g. `orders.status`) so customer and admin stay in sync.

### 7. Half-price first month if purchase is after the 15th; then bill on the 1st

- **Timezone (resolved):** All journal business rules that need **“today”**, **calendar month**, or **day of month** (including “after the 15th”) use the **business location**: **`America/Los_Angeles`** (USA, Los Angeles). Implement with that IANA zone on the server (and document it in UI/legal copy if customers may be outside the Pacific zone).
- **Initial purchase only:** If the customer’s **first** wellness-journal monthly purchase happens **after the 15th** of a calendar month in **America/Los_Angeles**, charge **half** of the normal monthly price for that checkout.
- **After that initial purchase is made**, treat the ongoing rhythm as: **each month begins on the 1st** for renewal, access boundaries, and messaging (“next month” = next calendar month on the 1st). The first period may be a short/partial month (with the discount); subsequent periods align to **month boundaries**.
- **Yes, we can implement this** in this stack: apply the adjusted amount in [`routes/shop.js`](c:/Projects/Website/routes/shop.js) when building the order total (and when calling Authorize.net), show the discount on cart/checkout/receipt, and set [`activateWellnessSubscription`](c:/Projects/Website/routes/subscription.js) (or follow-on logic) so `current_period_end` / next renewal lines up with the **1st** after the first purchase. **Server-side validation is mandatory** so the charged amount cannot be forged from the browser.

---

## Implementation notes (for a later pass)

- **Time:** Use `America/Los_Angeles` consistently for Decision 4, 7, and any “by the 1st” messaging (e.g. `Intl` or a small date library with explicit zone in Node).
- **Download definition:** Decide what increments the monthly counter (each print/PDF trigger, or one “satisfied whole month” flag after full export).
- **Reminders:** In-app (journal + account) minimum; optional email if SMTP already used for receipts.
- **Relation to** [`digital_fulfillment_complete_on_download.plan.md`](digital_fulfillment_complete_on_download.plan.md): general digital-only orders may use a similar “complete on download” rule; **journal subscription orders** use **Decision 6** (complete when **last paid month** for **that order** is downloaded).
- **Decision 4 vs 7:** Decision 4 anchors the **12-month tracking window** to the purchase month; Decision 7 adds **pricing** for late- month signups and **billing cadence** to the **1st** after the first purchase.

---
