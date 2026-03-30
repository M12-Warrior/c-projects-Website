# Pre-merge / go-live checklist

Use this before merging to your main branch or deploying to your live site (e.g. Railway → mile12warrior.com).

---

## Code / repo

- [ ] **Payments** — For live card checkout, set **`AUTHORIZE_*`** env vars on the host (see [PAYMENTS-AUTHORIZE-NET-SETUP.md](PAYMENTS-AUTHORIZE-NET-SETUP.md)); verify **`/api/shop/payment-config`**. Shop/cart copy assumes checkout is available when configured.
- [ ] **No secrets in repo** — No `.env` or real API keys committed (they’re in host env vars).
- [ ] **Brand assets** — `public/images/logo.png` (or `.svg`) and `public/images/hero-bg.png` are present and committed.

---

## Host / production (Railway or similar)

- [ ] **Volume + DB** — A persistent volume is mounted (e.g. `/data`) and **`DB_PATH`** is set (e.g. `DB_PATH=/data/drivershield.db`) so the SQLite DB and data survive deploys.
- [ ] **Env vars** — At least: `NODE_ENV=production`, and **`SESSION_SECRET`** set to a long random string. Optional: `BASE_URL=https://mile12warrior.com`; SMTP vars if you want password-reset emails.
- [ ] **Domain** — Custom domain (e.g. mile12warrior.com) is set in the host and DNS points to it; SSL is on.
- [ ] **After first deploy** — Change the default admin password (seed is `admin` / `admin123`).

---

## Optional

- [ ] **SMTP** — If you want “Forgot password” to send real emails, set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT`, and optionally `FROM_EMAIL` on the host.

Once these are done, you’re ready to merge and deploy.
