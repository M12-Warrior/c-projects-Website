---
name: Customer categories individual fleet school
overview: Add customer category (individual, fleet, school) to the database and expose it in registration, profile, and admin so you can segment and report by customer type.
todos: []
isProject: false
---

# Customer categories: individual, fleet, school

## Goal

Store and use a **customer category** so you know whether each customer is an **individual**, **fleet**, or **school**. This supports segmentation, reporting, renewal logic (e.g. fleet vs individual), and messaging.

---

## 1. Database

**Table: `users`**

- Add one column via migration in [db/database.js](db/database.js) (same pattern as existing `ALTER TABLE users ADD COLUMN ...`):
  **`customer_category`** — `TEXT`, nullable. Allowed values: `'individual'` | `'fleet'` | `'school'`.
- **Migration example:**

```js
  try {
    db.exec("ALTER TABLE users ADD COLUMN customer_category TEXT");
  } catch (_) {}
  

```

- **Default:** Leave existing rows as `NULL` (unknown). New registrations can set it at signup or leave it null until set in profile. Optionally you can add a CHECK constraint or enforce values in application code only (SQLite CHECK is supported).
- **Index (optional):** If you often filter or report by category (e.g. “all fleet customers”), add:
  `CREATE INDEX IF NOT EXISTS idx_users_customer_category ON users(customer_category);`

---

## 2. Where to set the category

- **Registration** — Add an optional (or required) “I am a(n): Individual / Fleet / School” selector on the sign-up form; save with the new user.
- **Profile / account settings** — Allow the user to change “Customer type” (Individual / Fleet / School) so it can be set or corrected later.
- **Admin** — In the admin user list and user edit view, show and edit `customer_category` so you can fix or assign categories.

Choice of “required at signup” vs “optional, can set later” is a product decision; the DB supports both (nullable column).

---

## 3. API and UI

- **Auth/register** — Include `customer_category` in the registration payload; validate as one of `'individual'` | `'fleet'` | `'school'` (or empty); insert into `users`.
- **Profile / preferences** — Expose `customer_category` in the user’s profile API (e.g. GET/PUT `/api/auth/profile` or preferences); allow updating it.
- **Admin** — In [views/admin.html](views/admin.html) and admin API (e.g. [routes/admin.js](routes/admin.js)), include `customer_category` when listing/editing users so you can filter and bulk-export (e.g. “all fleet” for renewal reminders).

---

## 4. Using the category

- **Renewal reminders** — Fleet packages and renewal logic can filter by `users.customer_category = 'fleet'` (and optionally by `product_access_grants.product_slug` and `expires_at`) when sending fleet renewal emails.
- **Reporting** — Count or segment users and orders by `customer_category` (individual / fleet / school).
- **Messaging** — Tailor copy (e.g. “Fleet admin” vs “Driver” vs “School”) in emails or UI based on `customer_category`.

---

## 5. Summary


| Item               | Detail                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Column**         | `users.customer_category` (TEXT, nullable)                                                                                                     |
| **Values**         | `'individual'` | `'fleet'` | `'school'`                                                                                                        |
| **Where set**      | Registration (optional/required), profile, admin                                                                                               |
| **Files to touch** | [db/database.js](db/database.js) (migration + optional index), registration view + route, profile/preferences API + view, admin user list/edit |


No new tables are needed; one column on `users` is enough to know if the customer is an individual, fleet, or school and to keep that in your data for tracking and segmentation.