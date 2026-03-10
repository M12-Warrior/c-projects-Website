# Go live step-by-step (first time)

This guide walks you through putting your Mile 12 Warrior site on the internet so people can visit **mile12warrior.com**. We use **GitHub** (where your code lives) and **Railway** (the server that runs your site). Do the steps in order.

---

## What you’ll need

- Your **Website** project folder on your computer (this repo).
- A **GitHub** account (free). If you don’t have one: [github.com](https://github.com) → Sign up.
- A **Railway** account (free tier is fine). We’ll sign up with GitHub.
- Your domain **mile12warrior.com** (you said it’s on Hostinger — we’ll point it to Railway).

---

## Part A: Get your code on GitHub

Your site needs to be in a GitHub repository so Railway can pull and run it.

### A1. Create a new repository on GitHub

1. Go to [github.com](https://github.com) and log in.
2. Click the **+** (top right) → **New repository**.
3. **Repository name:** e.g. `mile12warrior` or `website` (any name you like).
4. Leave it **Public**. Don’t check “Add a README” (you already have code).
5. Click **Create repository**.

### A2. Push your project to that repo

1. Open **PowerShell** (or Command Prompt) on your computer.
2. Go to your project folder:
   ```powershell
   cd C:\Projects\Website
   ```
3. If you’ve never used Git here, set your name and email once (use your real name and email). Run **two separate** commands — note `user.name` and `user.email`:
   ```powershell
   git config --global user.name "Your Name"
   git config --global user.email "your@email.com"
   ```
4. If this folder is not yet a Git repo, run:
   ```powershell
   git init
   ```
5. Add GitHub as the remote (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and the repo name you chose):
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   ```
   If you already have a `remote` and want to point it at this new repo:
   ```powershell
   git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   ```
6. Add all files, commit, and push:
   ```powershell
   git add .
   git commit -m "Prepare site for go-live"
   git branch -M main
   git push -u origin main
   ```
   If Git asks for login, use your GitHub username and a **Personal Access Token** (not your GitHub password). To create one: GitHub → Settings → Developer settings → Personal access tokens → Generate new token; give it “repo” scope.

When this is done, your code is on GitHub.

---

## Part B: Deploy on Railway

### B1. Sign up and create a project

1. Go to [railway.com](https://railway.com) and click **Login**.
2. Choose **Login with GitHub** and authorize Railway.
3. Click **New Project**.
4. Choose **Deploy from GitHub repo**.
5. Select the repository you just pushed (e.g. `mile12warrior` or `website`). If you don’t see it, click **Configure GitHub App** and allow Railway to see the repo, then try again.
6. Railway will create a project and start a first deploy. Wait until the deploy finishes (green checkmark or “Success”).

### B2. Add a persistent volume (so your database isn’t wiped)

Your site uses a SQLite database file. Without a volume, that file is deleted every time Railway redeploys. This step fixes that.

1. In Railway, open your **project** (the one you just created).
2. Click your **service** (the one box that represents your app).
3. Open the **Variables** tab (or **Settings** → **Variables**).
4. Open the **Volumes** tab (might be under the service or under **Settings**). Click **Add Volume** or **New Volume**.
5. **Mount path:** type exactly: **`/data`**
6. Save / Create.
7. Back in **Variables**, add a new variable:
   - **Variable:** `DB_PATH`
   - **Value:** `/data/drivershield.db`
8. Trigger a redeploy so the app starts with the volume: **Deployments** tab → click the **⋯** on the latest deploy → **Redeploy**, or push a small commit to GitHub so Railway redeploys automatically.

### B3. Set environment variables

1. Still in your Railway service, go to the **Variables** tab.
2. Add these one by one (click **+ New Variable** or **Add Variable**):

   | Variable        | Value |
   |-----------------|--------|
   | `NODE_ENV`      | `production` |
   | `DB_PATH`       | `/data/drivershield.db` (if you didn’t add it in B2) |
   | `SESSION_SECRET`| *(see below)* |
   | `BASE_URL`      | `https://mile12warrior.com` (optional but good) |

3. **SESSION_SECRET:** Use a long random string. Two options:
   - **Option A:** In PowerShell run:
     ```powershell
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
     Copy the output (one long line) and paste it as the value of `SESSION_SECRET`.
   - **Option B:** Use a password generator (e.g. [randomkeygen.com](https://randomkeygen.com)) and pick a 32+ character “Code Key” or “Fort Knox” style string.

4. Save. Railway will redeploy when you change variables (or you can redeploy manually).

---

## Part C: Use your domain (mile12warrior.com)

### C1. Add the domain in Railway

1. In your Railway service, go to **Settings** (or the **Networking** / **Domains** section).
2. Find **Domains** or **Public Networking** and click **Add custom domain** (or **Generate domain** first to get a default `*.up.railway.app` URL, then add custom).
3. Type: **mile12warrior.com** → Add.
4. If you want **www.mile12warrior.com** too, add **www.mile12warrior.com** as well.
5. Railway will show you DNS instructions: often a **CNAME** for `www` and an **A** record or CNAME for the root (`@`). Leave this tab open — you’ll need the values in the next step.

### C2. Point your domain at Railway (in Hostinger)

1. Log in to **Hostinger** (where you bought mile12warrior.com).
2. Open **Domains** → select **mile12warrior.com** → **DNS / DNS Zone** (or **Manage DNS**).
3. You’ll see a list of records (A, CNAME, etc.). Add or edit as Railway says:
   - **Root domain (`@`):** Railway may give you an **A** record with an IP, or a CNAME. Create or update the **A** or **CNAME** for `@` with the value Railway shows.
   - **www:** Create or update a **CNAME** record: name **www**, target = the value Railway gives (e.g. `something.up.railway.app`).
4. Save. DNS can take 5–60 minutes (sometimes up to 48 hours). Railway will turn on HTTPS automatically when it sees the domain.

### C3. Check that the site loads

1. Open a browser and go to **https://mile12warrior.com** (and **https://www.mile12warrior.com** if you set that up).
2. You should see your Mile 12 Warrior homepage. If you get “can’t connect” or “site not found,” wait a bit for DNS and try again, or double-check the A/CNAME values in Hostinger.

---

## Part D: First-time security (admin password)

The site ships with a default admin account so you can log in. You **must** change that password on the live site.

1. Go to **https://mile12warrior.com** (or your Railway URL).
2. Click **Sign In** (or go to `/login`).
3. Log in with:
   - **Username/email:** `admin`
   - **Password:** `admin123`
4. After login, go to your **Profile** (or account/settings) and **change the password** to something strong and unique. Don’t leave it as `admin123`.

---

## Part E: Quick check that everything works

- [ ] Homepage loads at https://mile12warrior.com
- [ ] You can open Shop, Cart, Checkout (checkout shows “Online payment coming soon” and doesn’t actually charge)
- [ ] You can log in as admin and change your password
- [ ] Logo and header image look correct (they’re in `public/images/`)

---

## Deploying updates to the live site

After the site is live, use this process whenever you make changes so the **live site at mile12warrior.com** gets the updates.

1. **Make and test locally** — Edit code in `C:\Projects\Website`. Optionally run `npm start` and test at http://localhost:3000.
2. **Commit and push** — In PowerShell: `cd C:\Projects\Website`, then `git add .`, `git commit -m "Your message"`, `git push origin main`. Use GitHub username and Personal Access Token if prompted.
3. **Railway redeploys** — When you push to `main`, Railway pulls the latest code and replaces the live site. In Railway → Deployments, wait for **Success**.
4. **Database** — New tables/columns in `db/database.js` (e.g. `course_completions`) are created automatically when the app starts. No manual migration needed.
5. **Verify** — Open https://mile12warrior.com, hard-refresh (Ctrl+F5), and check updated areas (Course, Admin → Completions).

---

## If something goes wrong

- **“Application failed” or deploy keeps failing:** In Railway, open the **Deployments** tab and click the latest deploy to see the build and run logs. Often the fix is: `DB_PATH` set correctly and a volume mounted at `/data`.
- **Site loads but “can’t connect to database” or 500 errors:** Check that the volume is mounted at `/data` and `DB_PATH` is exactly `/data/drivershield.db`, then redeploy.
- **Domain doesn’t open:** Wait for DNS (up to an hour). In Hostinger, confirm the A and CNAME records match what Railway shows. In Railway, check that the custom domain is added and verified.

---

## Later: when you add real payment

1. In your code, open **views/checkout.html**.
2. Find the line: **`var PAYMENT_COMING_SOON = true;`**
3. Change it to: **`var PAYMENT_COMING_SOON = false;`**
4. Commit and push to GitHub. Railway will redeploy. You can then remove or hide the “Online payment coming soon” banner and the small notes on the shop and cart pages if you want.

---

## Short checklist (so you don’t miss anything)

| # | Step |
|---|------|
| A1 | Create a new repo on GitHub |
| A2 | Push your `C:\Projects\Website` code to that repo |
| B1 | Railway: New Project → Deploy from GitHub repo → select repo |
| B2 | Railway: Add Volume mount path `/data`; add variable `DB_PATH=/data/drivershield.db`; redeploy |
| B3 | Railway: Add variables `NODE_ENV=production`, `SESSION_SECRET`, and optionally `BASE_URL` |
| C1 | Railway: Add custom domain mile12warrior.com (and www if you want) |
| C2 | Hostinger: Point DNS (A and/or CNAME) to the values Railway shows |
| C3 | Wait for DNS, then open https://mile12warrior.com |
| D  | Log in as admin / admin123 and change your password |
| E  | Click through Home, Shop, Cart, Checkout, and Profile to confirm |

Once you’ve done A through E, your site is live and you haven’t missed the important parts.
