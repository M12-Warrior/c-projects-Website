# Deploy to Railway (mile12warrior.com)

This project is set up to run on **Railway** with your logo, header image, and brand colors (concrete gray, safety gold, silver/chrome). Follow these steps to go live.

---

## 1. Add your brand assets (before or after deploy)

- **Logo:** Save your logo as **`public/images/logo.png`** (or `.svg`). The nav will show it site-wide; if the file is missing, the fallback text + icon shows.
- **Header image:** Your official M12 banner is already at **`public/images/hero-bg.png`**. The homepage hero uses it as the background with a light overlay so text stays readable.

Commit and push so these files are in the repo when you deploy.

---

## 2. Sign up and create a project on Railway

1. Go to [Railway](https://railway.com?referralCode=7f6OG0) and sign up (GitHub login is easiest).
2. Click **New Project**.
3. Choose **Deploy from GitHub repo** and connect this repository (or push this code to a GitHub repo first, then connect it).
4. Railway will detect Node.js. If it doesn’t, set:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Root directory:** (leave blank if the app is at the repo root)

---

## 3. Add a persistent volume (REQUIRED — fixes disappearing posts and images)

Railway's filesystem is **ephemeral**: anything written while the site is running —
the SQLite database **and** uploaded images in `public/uploads/` — is **erased on every
redeploy or restart**. That is why new blog posts "won't stay published" (the post is
created, then wiped on the next deploy, and only the original seeded posts come back) and
why uploaded images disappear over time while images committed to the repo
(`public/images/`) survive.

The fix is to put **both** the database and uploads on a single persistent **Volume**.
This is a **one-time setup you must do in the Railway dashboard** — it cannot be done from
code.

**Steps (do these once):**

1. In your Railway project, open your **service** (the web app).
2. Go to the **Volumes** tab (or **Settings** → **Volumes**) and click **Add Volume**.
3. Set the **Mount path** to **`/data`** and create the volume.
4. Go to the **Variables** tab and add these two variables:
   - **`DB_PATH`** = **`/data/drivershield.db`**
   - **`UPLOADS_DIR`** = **`/data/uploads`**
5. Click **Deploy** (or trigger a redeploy). The app creates `/data/drivershield.db` and
   `/data/uploads` automatically on first run, and serves uploaded images from there at
   `/uploads/<file>`.

After this, new blog posts and uploaded images persist across every future deploy.

> **⚠️ One-time data-loss caveat:** Because the old data lived on the ephemeral
> filesystem, attaching a **fresh** volume starts with an **empty** database. On first
> boot the app re-seeds the **original** blog posts only. Any posts created since the last
> deploy — and any images uploaded since the last deploy — existed only in ephemeral
> storage and **cannot be recovered**. This is a one-time reset; everything created
> **after** the volume is attached is permanent. Plan to re-create recent posts and
> re-upload recent images after the volume is live.

Locally you don't need to set anything: `DB_PATH` and `UPLOADS_DIR` default to
`db/drivershield.db` and `public/uploads/` in the repo.

---

## 4. Custom domain (mile12warrior.com)

1. In your Railway service, go to **Settings** → **Domains** (or **Networking**).
2. Click **Add custom domain** and enter **`mile12warrior.com`** (and optionally **`www.mile12warrior.com`**).
3. Railway will show you the **CNAME** target (e.g. `your-app.up.railway.app`) or the **A** record to use.
4. In **Hostinger** (where your domain is):
   - Open **DNS** for mile12warrior.com.
   - For **`@`**: use the **A** record or the value Railway gives for root.
   - For **`www`**: use a **CNAME** to Railway’s hostname (e.g. `your-app.up.railway.app`).
5. Save DNS. SSL is automatic on Railway once the domain is verified.

---

## 5. Environment variables

- **`PORT`** — Railway sets this automatically; the app uses `process.env.PORT || 3000`.
- **`DB_PATH`** — Set to `/data/drivershield.db` (or your volume path) so the SQLite file persists.
- **`UPLOADS_DIR`** — Set to `/data/uploads` (on the same volume) so uploaded images persist. Without it, uploads are wiped on every redeploy.
- **`NODE_ENV`** — Set to **`production`** on Railway (required for secure session cookies and secret checks).
- **`SESSION_SECRET`** — **Required in production.** A long random string (32+ chars) for signing session cookies. The app **will not start** if this is missing or still set to the dev default. Generate one locally, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, and paste into Railway Variables.
- **`ADMIN_INITIAL_PASSWORD`** — **Required on first deploy** to an empty production database if you need the seeded `admin` user. Use a strong password; the app does **not** seed `admin123` in production. After first login, change the password under Account.
- **`BASE_URL`** — (Recommended.) Full site URL (`https://mile12warrior.com`) for password-reset and order receipt links.
- **SMTP** (recommended in production): `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT`, `FROM_EMAIL`. Without SMTP, password-reset emails are not sent (reset links are not logged in production).
- **Stripe** (when you enable payments): `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. See **`docs/PAYMENTS-STRIPE-SETUP.md`**. If test keys were ever exposed, rotate the secret key in the Stripe Dashboard before deploying new values.

---

## 6. After deploy

- Open **https://mile12warrior.com** (or your Railway URL) and confirm the site loads.
- Log in with your admin user. **Production:** set `ADMIN_INITIAL_PASSWORD` before first boot on an empty DB, or create an admin another way — default `admin123` is **not** seeded in production. Change the password immediately after first login.
- Confirm the **logo** and **header image** show correctly; they’re at `public/images/logo.png` and `public/images/hero-bg.png`.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Add `public/images/logo.png` and `public/images/hero-bg.jpg` (your brand assets). |
| 2 | Create a Railway project, connect GitHub, deploy. |
| 3 | Add a **Volume** at `/data` and set **`DB_PATH=/data/drivershield.db`** and **`UPLOADS_DIR=/data/uploads`** (keeps posts and images permanent). |
| 4 | Add custom domain **mile12warrior.com** in Railway; point Hostinger DNS to Railway. |
| 5 | Set **`SESSION_SECRET`** and **`ADMIN_INITIAL_PASSWORD`** (empty DB); redeploy; change admin password after first login. |

The site is already styled with **concrete gray**, **safety yellow/gold**, and **silver/chrome** so it matches your trucking/safety brand and works with your existing header and logo.
