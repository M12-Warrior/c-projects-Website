# Mile 12 Warrior LLC — Owner Business Ops Checklist

**Private / internal.** This is your “one place” to organize the business so you can eat the elephant one bite at a time.  
Fill in the blanks as you go. Perfect is not the goal — **findable and repeatable** is.

Last updated: 2026-08-09

---

## Tonight — Stripe checkout go-live (your side)

Do these when you’re ready (code/copy is prepared; **do not** unpause until keys + webhook look good):

1. [ ] Stripe → confirm new bank is the **default payout** account  
2. [ ] Railway → Variables: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `BASE_URL=https://mile12warrior.com`  
3. [ ] Stripe → webhook endpoint `https://mile12warrior.com/api/stripe/webhook` (live mode if taking real cards)  
4. [ ] When ready: set `CHECKOUT_PAUSED=false` → redeploy  
5. [ ] One test checkout (test mode first is fine)  
6. [ ] SEO: wait on RSM for URL types on the first 5 topics (no rush tonight)

Full detail: `docs/PAYMENTS-STRIPE-SETUP.md` + `docs/PRODUCT-PRICING-DECISION.md`

---

## How to use this file (read this once)

1. **Do not try to finish the whole list this week.**
2. Each section has a **Bite size** (15–45 min) and a **Done when** line.
3. Put a date in `[ ]` when you finish something: `[x] 2026-08-10`.
4. Keep **one folder** on your computer (or Google Drive) as the master vault — see §1.
5. When something feels urgent, ask: *Is this Foundation, Money, or Visibility?* Do Foundation/Money before more new projects.

**Suggested weekly rhythm (thin-time version)**  

- **1× / week (60–90 min):** Money + admin bite  
- **1× / week (45–60 min):** One content bite (blog *or* social — not both required)  
- **1× / month (2 hrs):** Goals review + tax/receipts catch-up  
- Everything else waits or goes on the “Later parking lot” at the bottom

---



## 1. Master vault — put everything in one nest

**Bite size:** 30–45 min  
**Done when:** You can open one folder and see Legal, Money, Goals, Marketing, Vendors.

### Create this folder structure (Google Drive or OneDrive recommended)

```
Mile12Warrior-Business/
  00-START-HERE/          ← this checklist PDF/export + passwords note (not real passwords)
  01-Legal-Formation/     ← LLC docs, EIN letter, licenses, trademark notes
  02-Insurance-Risk/
  03-Banking-Accounts/    ← which accounts exist + what each is for
  04-Money-In/            ← invoices, Stripe/Railway payouts, sales reports
  05-Money-Out-Receipts/  ← receipts by year/month
  06-Taxes/               ← CPA, quarterly estimates, year-end packets
  07-Vendors-Contracts/   ← RSM, Hostinger, Railway, Stripe, domain, etc.
  08-Goals-Planning/
  09-Brand-Mission/
  10-Marketing-Content/   ← blog drafts, social ideas, RSM notes
  11-Website-Ops/         ← logins inventory (links only), deploy notes
```

Checklist:

- [ ] Create the folders above
- [ ] Move what you already have into the right folders (don’t rename/reformat yet — just relocate)
- [ ] Put a short `README.txt` in `00-START-HERE` with: legal name, EIN location, CPA name/email, “where receipts live”
- [ ] Bookmark this checklist file: `docs/OWNER-BUSINESS-OPS-CHECKLIST.md` in the Website project

---



## 2. Business identity & mission (clarity first)

**Bite size:** 20–30 min  
**Done when:** You can say what you do, for whom, and why in 3–4 sentences.

### Mission draft (edit in place)


| Piece               | Your answer                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| Who we serve        | Professional truck drivers, fleets/safety depts, and drivers’ families (Social Butterflies)         |
| What we provide     | Safety & wellness education: free New Driver packet, checklists, and journal; paid course + seasoned/fleet packets; community |
| How we’re different | Driver-owned voice, 25+ years lived experience — not a carrier recruiter, not a lawsuit firm        |
| One-line mission    | To help drivers achieve a healthy, proactive lifestyle that balances road, work, and home life.     |


**Short About us (internal):**  
Mile 12 Warrior LLC helps professional drivers and their families learn how to live a healthier, safer life both on and off the road. We do this by giving them tools and education focusing on fatigue, HOS-mindful rest, wellness, and support for both the driver and their families.

Checklist:

- [x] Write / refine one-line mission
- [x] Write 3–5 sentence “About us” paragraph (can match About page)
- [x] Save final copy in `09-Brand-Mission/mission.md` (paste the mission + About us above into that vault file)
- [ ] Confirm public About page still matches (later — not tonight)

---



## 3. Legal & formation documents (gather, don’t recreate)

**Bite size:** 45 min this week; finish over 2–3 sessions  
**Done when:** Every critical doc is in `01-Legal-Formation/` *or* you know exactly who has it.


| Document                                               | Have it?                        | Where it lives now                      | Copied to vault? |
| ------------------------------------------------------ | ------------------------------- | --------------------------------------- | ---------------- |
| Articles / Certificate of Organization (LLC)           | [ x] Yes [ ] No [ ] Need copy   |                                         | [ y]             |
| Operating Agreement                                    | [ x] Yes [ ] No [ ] N/A         |                                         | [ y]             |
| EIN confirmation (IRS CP 575 or similar)               | [ x] Yes [ ] No                 |                                         | [y ]             |
| CA / state filings & renewals                          | [x ] Yes [ ] No                 |                                         | [y ]             |
| Business license(s) / city/county if required          | [x ] Yes [ ] No [ ] Check       |                                         | [ y]             |
| Trademark notes (Mile 12 Warrior / Social Butterflies) | [ x] Yes [ ] No                 |                                         | [ yy]            |
| Domain ownership proof / registrar login               | [x ] Yes [ ] No                 |                                         | [ y]             |
| Privacy Policy / Terms (live site versions)            | [ ] Yes                         | `docs/legal/` print HTML → PDF to vault | [ ]              |
| Insurance (general liability / other)                  | [ ] Yes [ ] No [ ] x-Need quote |                                         | [ ]              |
| Registered agent info                                  | [ ]x Yes [ ] No                 |                                         | [ y]             |


Bite checklist:

- [x] Photograph or PDF every paper doc you can find (phone scan is fine)
- [x] Name files clearly: `2024-EIN-letter.pdf`, `LLC-Articles.pdf`
- [x] List missing docs and **one next action** each (email SOS, check old email, call formation service)
- [x] Note renewal dates (SOS, domain, insurance) in §8 calendar

**Not legal advice:** If something is missing, a business attorney or your formation service can help replace it. This list is only an inventory.

---



## 4. Map every money account (stop the “which card was that?” spiral)

**Bite size:** 45–60 min  
**Done when:** You have a single table of every account that touches the business.

### Account map (fill this in)


| Nickname                           | Bank / card | Last 4 | Purpose (business only / mixed / personal) | Still open? | Primary for      | Notes           |
| ---------------------------------- | ----------- | ------ | ------------------------------------------ | ----------- | ---------------- | --------------- |
| Example: Ops checking              | Chase       | 1234   | Business                                   | Yes         | Vendors, hosting | Closing soon?   |
|                                    |             |        |                                            |             |                  |                 |
|                                    |             |        |                                            |             |                  |                 |
|                                    |             |        |                                            |             |                  |                 |
|                                    |             |        |                                            |             |                  |                 |
| Stripe                             | Stripe      | —      | Business income                            | Yes         | Shop / checkout  | Payouts to ____ |
| Railway / Hostinger / domain cards |             |        |                                            |             | Subscriptions    |                 |


Also list:

- [ ] PayPal / Cash App / Venmo used for business? Yes/No — where
- [ ] Old accounts to close (after statements downloaded)
- [ ] New accounts still needed (what for?): _______________________



### Golden rule going forward

- [ ] Pick **one** primary business checking account for ops
- [ ] Pick **one** primary business card for subscriptions (or one debit)
- [ ] Everything new goes on those two when possible
- [ ] Mixed personal/business history: don’t panic — download statements; clean forward from a start date you choose

---



## 5. Money system — income, expenses, vendors, “who paid from where”

**Bite size:** Set up 60–90 min once; then 30–45 min weekly  
**Done when:** You can answer “What did we spend last month?” without digging through texts.

### 5A. Choose your money home (pick ONE — simple wins)


| Option                             | Best if                               | Notes                        |
| ---------------------------------- | ------------------------------------- | ---------------------------- |
| **A. Spreadsheet** (Google Sheets) | You want free + flexible now          | Start here if overwhelmed    |
| **B. QuickBooks / Wave / similar** | You’re ready for bookkeeping software | Great with a CPA later       |
| **C. CPA’s preferred tool**        | You already have an accountant        | Ask them — do what they want |


Recommendation while pressed for time: **start with A this month**, upgrade later if needed.

### 5B. Minimum spreadsheet tabs

**Ready-made templates (not a live Google link — you import into your own Drive):**  
See folder `[docs/money-tracker/](money-tracker/README.md)`

- `01-Accounts.csv` → `02-Income.csv` → `03-Expenses.csv` → `04-Vendors.csv` → `05-Transfers.csv`
- Open `docs/money-tracker/README.md` for click-by-click Google Sheets import + **receipt scan workflow**

Create one Google Sheet: `Mile12Warrior-Money-Tracker`

1. **Accounts** — copy of §4 table
2. **Income** — date, source (Stripe/shop/booking/other), amount, account deposited to, link/note
3. **Expenses** — date, vendor, category, amount, paid from (account/card), receipt file name, tax-relevant? Y/N
4. **Vendors** — name, what they do, login URL (not password), how paid, renewal date, contract folder path
5. **Transfers** — when you move money between your own accounts (so it isn’t double-counted as income)



### 5C. Expense categories (keep short)

- Website / hosting / domain  
- Software / subscriptions  
- Marketing / SEO (e.g. Relevant Search Media)  
- Professional services (legal, CPA, design)  
- Office / supplies / shipping  
- Education / research  
- Travel / vehicle (only if truly business — ask CPA)  
- Bank fees  
- Other



### 5D. Weekly money bite (same day each week)

- [ ] Download / screenshot new receipts into `05-Money-Out-Receipts/YYYY/MM/`  
- [ ] Enter new expenses (15–20 min)  
- [ ] Enter new income (Stripe payouts, etc.)  
- [ ] Glance at upcoming renewals (domain, RSM, tools)



### 5E. Vendor / payment cheat sheet (examples — edit)


| Vendor                | Pays for           | Paid from       | Cadence                 | Contract / invoice lives in |
| --------------------- | ------------------ | --------------- | ----------------------- | --------------------------- |
| Relevant Search Media | SEO package        | _______         | Term through 2027-07-28 | `07-Vendors-Contracts/`     |
| Railway               | Website host       | _______         | Monthly                 |                             |
| Hostinger / registrar | Domain DNS         | _______         | Yearly                  |                             |
| Stripe                | Payment processing | fees from sales | Ongoing                 |                             |
|                       |                    |                 |                         |                             |




### 5F. “Find old expenses” recovery plan (one-time project)

Do in order — one bank per session:

1. [ ] List every account from §4
2. [ ] For each: download **PDF statements** for the last 12–24 months into `03-Banking-Accounts/Statements/`
3. [ ] Highlight or export business-looking lines into Expenses tab
4. [ ] Match big ones to receipts/emails when you can
5. [ ] Mark gaps “unknown — ask CPA if material”

You will not reconstruct perfection. You will build a **good enough packet** for taxes and peace of mind.

---



## 6. Taxes & receipt discipline

**Bite size:** 30 min setup; quarterly catch-ups  
**Done when:** You know your CPA (or that you need one) and where this year’s docs go.

**Not tax advice** — use a CPA/EA for filings and what is deductible.

Checklist:

- [ ] Decide: DIY software vs CPA for this tax year  
- [ ] Put CPA name/email/phone in `00-START-HERE`  
- [ ] Confirm business entity tax classification (ask CPA)  
- [ ] Folder: `06-Taxes/2026/` (and prior years as needed)  
- [ ] Know sales tax obligations for your products/state (ask CPA — digital vs physical can differ)  
- [ ] Quarterly estimate reminder dates (if required): ________  
- [ ] Year-end packet goal: Income summary + Expenses export + Receipts folder + 1099s/Ks when they arrive  

Receipt rule (simple):

- [ ] Photo receipt the same day → drop in that month’s folder → log in sheet within a week  

---



## 7. Goals — make them small enough to survive real life

**Bite size:** 30–40 min  
**Done when:** You have 3 outcomes for the next 90 days — not 30 dreams.

### North star (12 months) — one sentence

*[e.g. “Stable ops + clear money picture + consistent weekly education content + SEO foundation with RSM.”]*

### Next 90 days — only THREE outcomes


| #   | Outcome (result, not busywork)           | Why it matters                    | First bite this week |
| --- | ---------------------------------------- | --------------------------------- | -------------------- |
| 1   | Money map + weekly expense habit running | Sleep better; tax-ready           | Fill §4 table        |
| 2   | Legal vault 80% complete                 | Risk / renewals                   | Scan LLC + EIN       |
| 3   | Content minimum rhythm restored          | Brand stays alive without burnout | See §8               |




### Explicit non-goals for 90 days (protect your energy)

- [ ] List things you will **not** start yet (new products, new platforms, redesigns, etc.):  
  1. ________
  2. ________
  3. ________

Review date (put on calendar): _______________

---



## 8. Schedule — thin-time productivity (realistic > impressive)

**Bite size:** 20 min to set; then live it for 2 weeks before changing  

### Fixed weekly blocks (edit times to your life)


| Day           | Block     | Focus                                                         |
| ------------- | --------- | ------------------------------------------------------------- |
| ___           | 60–90 min | **Admin / money** (receipts, sheet, email admin)              |
| ___           | 45–60 min | **Content** (blog polish *or* 3 social posts — pick one mode) |
| ___           | 30 min    | **Partner / SEO** (RSM WhatsApp + portal Files/progress note) |
| Month ___ day | 2 hrs     | **Monthly close** (money + goals check)                       |




### Content minimum (when time is thin)

Pick a **tier** and stick to it for 30 days:


| Tier         | Commitment                                        |
| ------------ | ------------------------------------------------- |
| **Survival** | 1 blog improvement/month + 0–2 social posts/month |
| **Steady**   | 1 blog/month + 1 short social/week                |
| **Growth**   | 2 blogs/month + 2–3 social/week                   |


Recommended starting tier while building ops: **Survival → Steady**.  
Blogs you already have can be *improved* (photos, typos) — that counts as content work.

### Daily 10-minute reset (optional but powerful)

- [ ] What’s the **one** business bite today?  
- [ ] What will wait without guilt?

---



## 9. Website & partner ops (so “site work” doesn’t eat the business)

Keep separate from personal chaos:


| Item                   | Where                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Marketing portal       | [https://mile12warrior.com/marketing](https://mile12warrior.com/marketing)                           |
| Next-90-days SEO brief | [https://mile12warrior.com/marketing/next-90-days](https://mile12warrior.com/marketing/next-90-days) |
| RSM keyword CSVs       | Portal → **Files** tab                                                                               |
| This checklist         | `docs/OWNER-BUSINESS-OPS-CHECKLIST.md`                                                               |
| Internal data notes    | `docs/INTERNAL-DATA-AND-COMMUNICATIONS.md`                                                           |


Checklist:

- [ ] Password manager entry for site admin (not in this file)  
- [ ] Railway / GitHub / domain logins in password manager  
- [ ] After any RSM decision: 2-line note in portal Progress or Shared notes  

---



## 10. First two weeks — your elephant starter pack



### Week 1

- [ ] Day 1: Create vault folders (§1) — 30 min  
- [ ] Day 2: Fill account map (§4) — 45 min  
- [ ] Day 3: Start money spreadsheet (§5B) — 45 min  
- [ ] Day 4: Scan/find LLC + EIN (§3) — 45 min  
- [ ] Day 5: Write mission one-liner + 90-day 3 goals (§2, §7) — 30 min  
- [ ] Put weekly Admin + Content blocks on calendar (§8)



### Week 2

- [ ] Download statements for **one** primary account (§5F)  
- [ ] Enter last 30 days of expenses you can find  
- [ ] Pick content tier (Survival/Steady)  
- [ ] One content bite (fix a blog post or schedule one social)  
- [ ] 15 min: update RSM in WhatsApp / portal if needed  

After Week 2: you will not be “done.” You will be **oriented** — which is the whole point.

---



## 11. Monthly close checklist (print or copy)

**Month: ________  Year: ________**

- [ ] All receipts for the month in the folder  
- [ ] Expenses entered  
- [ ] Income entered  
- [ ] Subscriptions still needed? Cancel junk  
- [ ] Vendor invoices filed  
- [ ] 90-day goals: on track / adjust  
- [ ] Content tier met? Yes / Partial / No — why without shame  
- [ ] One win to write down: _______________________  

---



## 12. Later parking lot (ideas that must wait)

Write shiny ideas here so they stop hijacking today:

Review parking lot only on monthly close.

---



## Encouragement (keep this)

You are not behind because the list is long.  
You are building a **company operating system** while also running the company.  

Progress looks like:

- folders that exist,
- one spreadsheet with real numbers,
- three goals,
- one weekly admin hour that actually happens.

When overwhelmed, reopen **§10 Week 1** and do the next unchecked box only.

---

*This document is an organizational tool, not legal, tax, or financial advice. Confirm filings, deductions, and account structure with qualified professionals.*