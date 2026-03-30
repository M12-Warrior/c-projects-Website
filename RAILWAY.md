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

## 3. Add a persistent volume for the database

Your app uses SQLite; the database file **must** live on a persistent volume or it will be wiped on every deploy.

1. In your Railway project, open your **service** (the web app).
2. Go to the **Variables** tab and note your **volume mount path** if you add one (e.g. `/data`).
3. Go to the **Volumes** tab (or **Settings** → **Volumes**). Click **Add Volume**.
4. Mount path: **`/data`** (or another path you prefer).
5. In **Variables**, add:
   - **`DB_PATH`** = **`/data/drivershield.db`**  
   (Use the same path you chose; the app will create the file on first run.)
6. Ensure **uploads** persist if you care about uploaded images. Either:
   - Mount a second volume at **`/app/public/uploads`** (if Railway lets you mount over a subpath), or  
   - Keep using the default `public/uploads` and accept that uploads may be lost on redeploy unless you use external storage later.

Redeploy after adding the volume and `DB_PATH`.

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
- **`NODE_ENV`** — Set to `production` in production.
- **`SESSION_SECRET`** — (Recommended in production.) A long random string for signing session cookies; if unset, a default is used.
- **`BASE_URL`** — (Optional.) Full site URL (e.g. `https://mile12warrior.com`) for password-reset and **order confirmation** receipt links; otherwise derived from the request.
- **SMTP** (optional, for password reset and **shop order confirmation emails**): `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT`, `FROM_EMAIL`. Without SMTP, orders still complete but no confirmation email is sent.

---

## 6. After deploy

- Open **https://mile12warrior.com** (or your Railway URL) and confirm the site loads.
- Log in with your admin user (from seed: `admin` / `admin123` — change the password in production).
- Confirm the **logo** and **header image** show correctly; they’re at `public/images/logo.png` and `public/images/hero-bg.png`.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Add `public/images/logo.png` and `public/images/hero-bg.jpg` (your brand assets). |
| 2 | Create a Railway project, connect GitHub, deploy. |
| 3 | Add a **Volume** (e.g. `/data`) and set **`DB_PATH=/data/drivershield.db`**. |
| 4 | Add custom domain **mile12warrior.com** in Railway; point Hostinger DNS to Railway. |
| 5 | Redeploy if needed; change default admin password after first login. |

The site is already styled with **concrete gray**, **safety yellow/gold**, and **silver/chrome** so it matches your trucking/safety brand and works with your existing header and logo.
