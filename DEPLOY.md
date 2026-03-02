# Point mile12warrior.com to this site

This project is configured to run as **mile12warrior.com**. To point your domain here:

---

## If mile12warrior.com is currently WordPress on Hostinger

You’ll **keep the domain** in Hostinger but **point its DNS** to wherever this Node.js app is running. Hostinger shared hosting runs PHP/WordPress and generally doesn’t run Node.js, so you have two paths:

### Option A — Easiest: Deploy this app elsewhere, then point the domain

1. **Deploy this app** to a host that supports Node.js (see section 1 below), e.g.:
   - **Railway** or **Render** (free tiers): connect your GitHub repo, set start command `npm start`, they give you a URL and often an IP or custom domain support.
   - **Fly.io**, **DigitalOcean App Platform**, etc.
2. **In Hostinger:** Log in → **Domains** → **mile12warrior.com** → **DNS / DNS Zone** (or **Manage** → **DNS**).
3. **Edit A records** so the domain points to the **new host**, not Hostinger:
   - Find the **A** record for `@` (root). Change its value from Hostinger’s IP to the **IP address** of your new host (Railway/Render/Fly often show this when you add a custom domain).
   - Find the **A** record for `www`. Point it to the **same IP** (or use a CNAME to the host’s hostname if they tell you to).
4. **Save** DNS. In 5–60 minutes (sometimes up to 24–48 hours) mile12warrior.com will open the new site.
5. **WordPress:** Your old site stays on Hostinger until you cancel or remove it. You can keep the hosting plan for other sites or cancel the WordPress part later. The **domain** just stops pointing at it once DNS is updated.

### Option B — Stay on Hostinger: Use a Hostinger VPS

If you have (or buy) a **Hostinger VPS** (not shared hosting), you can run Node.js there:

1. Deploy this project on the VPS (e.g. clone repo, `npm install`, `npm start`, and use PM2 or Nginx so it keeps running).
2. In Hostinger’s DNS for mile12warrior.com, set the **A** records for `@` and `www` to your **VPS IP**.
3. Set up HTTPS on the VPS (e.g. Nginx + Let’s Encrypt).

Shared hosting on Hostinger usually **cannot** run this Node app; use Option A or a VPS.

---

## 1. Deploy this app to a server

Host this Node.js app somewhere that gives you a **public IP** or **hostname**, for example:

- **VPS** (DigitalOcean, Linode, Vultr, etc.) — run `node server.js` (or use a process manager like PM2) and open port 3000, or put it behind Nginx.
- **PaaS** (Railway, Render, Fly.io, etc.) — connect your repo and set the start command to `npm start`. They’ll give you a URL like `yourapp.up.railway.app` or an IP.

You need either:

- The server’s **IP address** (e.g. `123.45.67.89`), or  
- A **hostname** they provide (e.g. `your-app.fly.dev`).

---

## 2. Point the domain (DNS)

Where you **registered** mile12warrior.com (GoDaddy, Namecheap, Cloudflare, Google Domains, etc.), open **DNS settings** and add:

| Type | Name  | Value                    | TTL  |
|------|--------|---------------------------|------|
| **A**    | `@`    | *your server IP*          | 300  |
| **A**    | `www`  | *your server IP*          | 300  |

If your host gave you a **hostname** instead of an IP (e.g. `your-app.onrender.com`):

| Type   | Name | Value                    | TTL  |
|--------|------|---------------------------|------|
| **CNAME** | `www` | `your-app.onrender.com` | 300  |

(Some hosts support CNAME on the root `@`; otherwise use their recommended setup, often an A record to their IP.)

Save DNS. Changes can take from a few minutes up to 24–48 hours.

---

## 3. HTTPS (recommended)

- **Cloudflare** (free): Add the site, set nameservers at your registrar, then SSL is handled by Cloudflare in front of your server.
- **Let’s Encrypt on your server**: If you use Nginx or Apache, use Certbot to get a certificate for `mile12warrior.com` and `www.mile12warrior.com`.

---

## 4. Optional: send www to non‑www (or the other way)

In your hosting/DNS (e.g. Cloudflare) or in Nginx, add a redirect so that:

- `https://www.mile12warrior.com` → `https://mile12warrior.com`  
  or  
- `https://mile12warrior.com` → `https://www.mile12warrior.com`

Pick one as the main URL and redirect the other. This project’s CORS allows both.

---

## Summary

1. Deploy this repo to a host (VPS or PaaS).  
2. In your domain registrar’s DNS, point `mile12warrior.com` and `www` to that host (A record to IP or CNAME to their hostname).  
3. Turn on HTTPS.  
4. After DNS propagates, **mile12warrior.com** will open this Driver Shield site.
