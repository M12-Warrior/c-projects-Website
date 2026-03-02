# Internal: Data We Collect & How to Use It (Not for Public View)

**Confidential — for Mile 12 Warrior LLC internal use only.**  
Do not publish this file or link to it from the public site. Use this information to send emails, newsletters, respond to posts, and support our community while always respecting users and helping them live their best lives.

---

## 1. What Data We Collect

| Source | Data | Where it lives |
|--------|------|----------------|
| **User accounts** | Username, email, password (hashed), role, optional bio/avatar, created_at | Database: `users` table |
| **Contact form** | Name, email, subject, message, read flag, created_at | Database: `contact_messages` table |
| **Orders** | user_id, total, status, shipping name/address/city/state/zip, created_at | Database: `orders`, `order_items` |
| **Forum** | Threads and replies tied to user_id; content, created_at | Database: `forum_threads`, `forum_replies` |
| **Blog** | Comments tied to user_id and post_id; content, created_at | Database: `blog_comments` |
| **Newsletter (contact)** | When users submit “newsletter” via contact form, that message is stored like any contact message (name, email, subject, message) | Database: `contact_messages` |

The database file is at **`db/drivershield.db`** (or path in `DB_PATH` on the server). It is not publicly viewable; only the app and you (via admin or direct DB access) can read it.

---

## 2. How to Access & Use This Data

### Admin panel (recommended)

- Sign in as admin, then go to **`/admin`**.
- Use it to:
  - **View users** (id, username, email, role, created_at).
  - **View contact messages** (name, email, subject, message, read status) — use this to **respond to posts** (contact form submissions) and to see newsletter-style signups that came in via the contact form.
  - View stats (user count, orders, forum threads, etc.).

### Newsletter / email list export

- **Export CSV (admin only):**  
  While signed in as admin, open:  
  **`/api/admin/export/newsletter`**  
  This downloads a CSV with: `email`, `username`, `created_at` for all registered users. Use this list only for **emails, newsletters, and support** in line with our Privacy Policy and Terms. Do not sell or share with third parties for marketing.

### Responding to posts and contact messages

- **Contact form and “newsletter” submissions:** Use **Admin → Messages** to read and mark messages as read. Respond to users via the email they provided; keep responses supportive and aligned with our mission.
- **Forum:** Use the forum as a moderator (admin) to reply to threads and support the community.
- **Blog comments:** Manage and respond via the same principles; user identity is tied to account data in the database if you need to follow up.

### Direct database access (optional)

- If you have access to the server or a copy of `db/drivershield.db`, you can use a SQLite client to run queries (e.g. list users, contact_messages, orders). This is for internal use only and must stay private.

---

## 3. Data Collection & Use Principles

- **Support and “living their best lives”:** Use collected data to improve the service, send helpful newsletters, respond to questions, and support the forum and blog — not for intrusive or irrelevant marketing.
- **Respect and transparency:** We state in our Privacy Policy and Terms what we collect and that users can **unsubscribe** from newsletters/blog/forum emails at any time. Honor those choices and remove or suppress contacts when requested.
- **No selling data:** We do not sell user data. The data in this file and in the database is for operating the site, fulfilling orders, and communicating with users in a supportive way.
- **Security:** Keep the database file and any exported CSVs in a secure, non-public place. Do not put them in the `public/` folder or anywhere that could be served by the web server.

---

## 4. Quick Reference

| Goal | Where to go |
|------|-------------|
| Send newsletters / email campaigns | Export list via `/api/admin/export/newsletter` (admin only); use a reputable email tool and honor opt-outs. |
| Respond to contact form / “newsletter” signups | Admin panel → Messages. |
| View or manage users | Admin panel → Users. |
| See purchase history (for support) | Admin panel stats and orders; full detail in `orders` / `order_items` in DB if needed. |
| Respond to forum or blog | Use forum and blog as admin/moderator; user emails are in `users` if you need to follow up privately. |

---

*Last updated: 2026. Keep this document and any exports confidential and in line with our Privacy Policy and Terms of Service.*
