# Wellness Journal Monthly -- audit (June 2026)

**For:** Joyce packet review (hold deploys until full review complete)
**Scope:** Print/download PDF, online `/journal`, storage
**Status:** Audit only -- no fixes deployed

---

## 1. Print / download today

**Route:** `/journal/print` -> static `views/journal-print.html`
**How it works:** Subscriber (or free-access mode) sees a page with a **Print or save as PDF** button -> browser `window.print()` -> user saves PDF or prints.

| Topic | Today |
|--------|--------|
| **Pages** | **3** repeated "Daily log" blocks (~2-3 printed pages). **Not** a full calendar month (28-31 days). |
| **Dates** | **Blank.** Headers say "Week of _______________"; Date row is an empty line. No current month/day/year. |
| **Note space** | Structured rows (sleep, meals, exercise, mood, mileage) + a **small** Notes area (~3 lines). Not a full-page lined notes section per day. |
| **PDF file** | No server-generated PDF. User relies on browser Print -> Save as PDF. |
| **Monthly scope** | Same generic template every visit. No "this month's journal" or subscription-month scoping. |
| **Tracking** | Opening print page POSTs `/api/journal/fulfillment-log` (marks latest paid wellness order `completed` v1). Download logged in `download_events`. |

**Gap vs Joyce:** Full month of pages; clear date on each day; room for handwritten notes under each day.

---

## 2. Online journal today

**Route:** `/journal` -> `views/journal.html`
**API:** `/api/journal/entries` in `routes/journal.js`
**Storage:** SQLite table `subscriber_journal_entries` (`user_id`, `entry_date`, `content`, timestamps).

| Topic | Today |
|--------|--------|
| **Model** | **Many entries per user.** Each Save creates a **new row** (INSERT). Same calendar day can have **multiple** entries -- no unique constraint on `(user_id, entry_date)`. |
| **UI** | One "Add entry" form (date picker + notes textarea) + chronological list with Edit/Delete per **entry id** (not per day). |
| **Per day?** | Date is **associated** with each entry, but UX is **entry-centric**, not "one page per day." Saving again the same day adds another list item unless user edits an existing one. |
| **Where stored** | **Server database**, tied to logged-in user. No `localStorage`. |
| **Access** | Active wellness subscription, admin, or site free-access mode (`wellnessAccess.userHasWellnessJournalAccess`). |
| **Retention** | **None defined.** Entries persist until user deletes them or account is removed. No purge after cancel. |

**Gap vs Joyce:** Clarify "one note block per calendar day"; ensure each day can hold notes without duplicate confusion.

---

## 3. Recommended approach (batch fix -- after full packet review)

### Print / PDF

**Recommend:** Generate **one page per calendar day** for the **active subscription month** (America/Los_Angeles), e.g. 28-31 pages.

- **Header:** e.g. `Monday, June 2, 2026` (month, day, year explicit).
- **Body:** Optional short wellness prompts OR blank **lined notes area** (majority of page) for handwriting.
- **Delivery:** Start with **print-optimized HTML** (like today's flow) -- lower risk than server PDF library. Optional later: true PDF download.
- **Align** with existing plan doc `wellness_journal_monthly_downloads_and_reminders.plan.md` (month-scoped download, counter, renew-by-1st copy).

### Online journal

**Recommend:** **One entry per calendar day per user** (upsert on save).

- DB: `UNIQUE(user_id, entry_date)` or app-level upsert in POST.
- UI: Month calendar or day picker showing filled/empty days; one textarea per selected day; single Save updates that day.
- Copy: "One note per day -- edit anytime."

### Storage (server vs device)

**Recommend:** **Lightweight server storage** (current table, with one row per day cap).

| Option | Pros | Cons |
|--------|------|------|
| **Server (recommended)** | Sync across phone/laptop; survives browser clear; matches login/subscription | Grows with users (~365 small rows/year each) |
| **localStorage only** | Zero DB growth | Lost on new device / clear data; no sync |
| **Hybrid** | Server while subscribed + Export JSON/PDF on cancel | More engineering |

**Retention policy (suggested):** Keep entries while subscription active + **90-day grace** after cancel; email + in-app "export your journal" before purge. At ~1-2 KB/entry, storage cost is negligible vs UX benefit of server sync.

**Do not** store print templates on server -- generate on demand.

---

## 4. Implementation sketch (post-review)

1. **Print:** JS or server template renders days 1..N for selected `YYYY-MM` (default current LA month); `@media print` page-break per day; update marketing copy ("full month").
2. **Online:** Upsert POST; optional migration merge duplicate same-day rows; calendar UI.
3. **Schema:** Unique index on `(user_id, entry_date)`; optional `journal_month_downloads` per existing plan.
4. **Feature flag:** e.g. `JOURNAL_MONTHLY_V2=1` until Joyce signs off on all packets.

---

## 5. Critical bugs

**None found** that require an emergency one-line fix. Current behavior matches code; gaps are **product/design** vs Joyce's requirements.

---

## Key files

- `views/journal-print.html` -- print template (3 static blocks)
- `views/journal.html` -- online UI
- `routes/journal.js` -- CRUD API
- `lib/wellnessAccess.js` -- access + download logging
- `db/database.js` -- `subscriber_journal_entries` schema
- `views/shop-product.html` -- product marketing / links
- `docs/plans/wellness_journal_monthly_downloads_and_reminders.plan.md` -- related monthly delivery plan (partially implemented)
