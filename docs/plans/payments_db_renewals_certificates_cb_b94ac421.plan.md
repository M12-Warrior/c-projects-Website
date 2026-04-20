---
name: Payments DB Renewals Certificates CB
overview: Extend the payments plan with database and features for expiration tracking, fleet renewal reminders, auto-renewal and certificate opt-ins, CB handle, and forum engagement reminders.
todos: []
isProject: false
---

# Payments, Database, Renewals, Certificates & CB Handle

This plan extends the Authorize.net payments and receipts work with the following.

---

## 1. Database: Customer data for expiration tracking and renewal reminders

**Already in place**

- [db/database.js](db/database.js): `product_access_grants` has `user_id`, `order_id`, `product_slug`, `expires_at`, `granted_at`, `download_count`, `max_downloads`. Fleet packages use 12‑month expiry (see [routes/shop.js](routes/shop.js) `DIGITAL_GRANT_MAP` and `FLEET_LICENSE_MONTHS`). So expiration dates are already stored; you can query grants with `expires_at` in a given window (e.g. next 30/60/90 days) and join to `users` (email) and optionally `orders` for context.

**Add for renewal reminders and preferences**

- **Users table** (migrations in [db/database.js](db/database.js)):
  - `opt_in_renewal_reminders` (INTEGER 0/1) — allow each customer to opt in or out of renewal reminder emails (e.g. “Your fleet package expires in 30 days”).
  - `opt_in_auto_renewal` (INTEGER 0/1) — opt in or out of automatic renewals (when you implement auto-renewal billing later; for now this is the preference only).
  - `cb_handle` (TEXT, nullable) — CB handle; optional, unique if present; display in forum/profile.
  - `phone` (TEXT, nullable) — optional, for SMS receipts or contact (if you add SMS later).
- **Orders table** (if not already present from receipts work):
  - `receipt_via` (TEXT, nullable) — e.g. `email` | `sms` | `both` for receipt delivery preference.
- **Index for renewal notices**
  - Index (or query pattern) on `product_access_grants(expires_at)` where `expires_at IS NOT NULL` so you can efficiently find “grants expiring in the next N days.” Existing index on `product_slug` helps filter fleet-related slugs (`fleet-new-hire-packet`, `fleet-refresher-packet`, `fleet-bundle`).

No new tables are required for “tracking expiration dates” — `product_access_grants.expires_at` plus user email from `users` is sufficient. The new columns above support reminders, auto-renewal preference, CB handle, and optional phone.

---

## 2. Renewal reminder notices (email)

- **Admin tool or scheduled job** that:
  - Finds grants with `expires_at` in a chosen window (e.g. 30, 60, 90 days from today) for fleet-related `product_slug`s.
  - Joins to `users` and only includes users with `opt_in_renewal_reminders = 1`.
  - Sends a renewal reminder email per user (e.g. “Your Mile 12 Warrior fleet package expires on [date]. Renew to keep access.”) with a link to shop or a renewal product.
- **Implementation options:** (A) Admin-only “Send renewal reminders” button that runs the query and sends emails (e.g. via existing nodemailer), or (B) a cron/scheduled job (e.g. weekly) that does the same. Choice depends on hosting (e.g. Railway cron or external scheduler).
- **Copy:** Include your branding, which product(s) expire, expiration date(s), and link to renew; optionally remind them of the forum for support (see section 5).

---

## 3. Auto-renewal opt-in / opt-out

- **Preference:** Store per-user with `opt_in_auto_renewal` (0 = out, 1 = in). Default to 0 (opt-out) for compliance and clarity.
- **Where to set:** Account or profile settings (and optionally at checkout or after first fleet purchase). Expose a clear “Automatically renew my fleet package” toggle; save via e.g. `PUT /api/auth/preferences` or a dedicated `PUT /api/auth/renewal-preferences`.
- **Behavior:** For the first phase, this is **preference only**. No automatic charge or extension of `product_access_grants` until you add a renewal billing flow (e.g. Authorize.net stored payment or renewal order). When you do add that flow, only users with `opt_in_auto_renewal = 1` would be eligible for automatic renewal charges; reminders can still go to everyone who has `opt_in_renewal_reminders = 1` and an expiring grant.

---

## 4. Course: mailed certificate only if they opt in

- **Current behavior:** [routes/course.js](routes/course.js) — On course completion, user submits `POST /api/course/complete` with student name and optional mailing address; a row is created in `course_completions` and the certificate is mailed to that address (admin uses [views/admin.html](views/admin.html) course completions table to mail).
- **Change:** Make the **mailed** certificate explicitly opt-in.
  - **Option A (minimal):** Add a boolean to the completion form: “Send me an official mailed certificate.” If unchecked, still create `course_completions` (for certificate number and record) but leave mailing address null and do not show the completion in the “mail certificate” admin list (or show with a “No mailing requested” flag so you only mail when requested).
  - **Option B:** Add `request_mailed_certificate` (INTEGER 0/1) to `course_completions`. When the user completes, they choose “Digital only” vs “Yes, mail me an official certificate.” Only when `request_mailed_certificate = 1` do you collect mailing address and include the completion in the “to be mailed” workflow.
- **Recommendation:** Option B: add `request_mailed_certificate` to `course_completions` and collect mailing address only when the user opts in. Admin “Course completions (certificates)” list can filter or highlight rows where `request_mailed_certificate = 1` and address is present, so you only mail those.

---

## 5. CB handle and forum reminders

- **CB handle**
  - **Storage:** `users.cb_handle` (TEXT, nullable, unique). “Create their CB handle” = set this field (and optionally use it as a display name in the forum).
  - **Where to create:** (1) Registration: optional “CB handle” field. (2) Profile/settings: “Create or change your CB handle” (one per account). (3) Post-checkout or post-course: prompt “Create a CB handle to join the community?” if `cb_handle` is null.
  - **Validation:** Length and character rules (e.g. alphanumeric and maybe spaces/hyphens; no profanity if you add a blocklist). Enforce uniqueness.
  - **Display:** In forum, show `cb_handle` when set, otherwise fall back to `username` (so “aka account” = their site account; CB handle = display name for the community).
- **Forum reminders**
  - **Where:** In transactional/engagement emails: order confirmation, receipt, renewal reminder, and (optionally) after course completion or first login.
  - **Content:** Short line such as: “Join the conversation — check out the forum rooms for driver support and community,” with a link to the forum (or specific categories). No new database fields; this is copy and links in existing email templates.

---

## 6. Suggested implementation order

1. **Database migrations** — Add `opt_in_renewal_reminders`, `opt_in_auto_renewal`, `cb_handle`, `phone` to `users`; add `request_mailed_certificate` to `course_completions`; add `receipt_via` to `orders` if not already present. Ensure index/query pattern for `product_access_grants.expires_at` for renewal queries.
2. **Preferences and profile** — API and UI for renewal reminder opt-in/out, auto-renewal opt-in/out, and CB handle (create/edit in profile and optionally at registration or post-purchase).
3. **Renewal reminder flow** — Admin “Send renewal reminders” (or cron) using `product_access_grants` + `users`; respect `opt_in_renewal_reminders`; include forum reminder in email.
4. **Course certificate opt-in** — Add `request_mailed_certificate` and only collect mailing address when opted in; update admin view so you only mail when requested.
5. **Forum reminder copy** — Add forum reminder line and link to receipt, order confirmation, and renewal reminder emails.

This keeps the necessary database in place for expiration tracking and renewal reminders, lets customers opt in or out of automatic renewals and renewal emails, limits mailed certificates to those who opt in, and adds CB handle plus forum reminders as requested.