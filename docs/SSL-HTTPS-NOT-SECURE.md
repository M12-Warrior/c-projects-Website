# Fixing "Connection not secure" on mile12warrior.com

If visitors see a browser warning that the connection is not secure (or that sensitive data could be stolen), use these steps to fix it.

---

## 1. Always use HTTPS

- **You and visitors should open:** **https://mile12warrior.com** (with **https**).
- **Do not use:** http://mile12warrior.com (no "s") — that connection is not encrypted and browsers will warn.

The site is set up to redirect **http** → **https** in production. If you still see a warning when using **https://**, continue below.

---

## 2. Check SSL in Railway

Railway issues a free SSL certificate (Let's Encrypt) for your custom domain. It must finish issuing before the padlock is valid.

1. In **Railway** → your project → click your service (**c-projects-website**).
2. Open **Settings** (or **Networking** / **Domains**).
3. Find **Custom Domains** and your domain **mile12warrior.com** (and **www** if you use it).
4. Check the status:
   - **Valid** / **Active** → certificate is OK; see step 3 (cache/browser).
   - **Issuing** / **Validating** → wait up to **1 hour** (sometimes up to 72 hours). Do not remove and re-add the domain; that can hit rate limits.
   - **Failed** / **Error** → see step 4 (DNS).

---

## 3. Browser cache and bookmarks

- **Hard refresh:** Ctrl+F5 (Windows) or Cmd+Shift+R (Mac) on https://mile12warrior.com.
- **Bookmark:** Use **https://**mile12warrior.com so you don’t open the old **http** link.
- **Try another browser or device** to see if the warning is only in one place.

---

## 4. DNS (if certificate is stuck or failed)

Railway needs your domain to point to them so Let's Encrypt can verify it.

1. In **Railway** → **Settings** → **Domains** → your domain. Note the **CNAME** (or **A**) target Railway shows (e.g. `xxx.up.railway.app`).
2. In **Hostinger** (or wherever your domain DNS is):
   - **Root (`@`):** Use the value Railway gives. Railway often wants a **CNAME** for `@` (some providers use “alias” or “ANAME” if they don’t allow CNAME on root).
   - **www:** CNAME **www** → same Railway target (e.g. `xxx.up.railway.app`).
3. Save DNS and wait **at least 1 hour** (up to 48–72 hours for full propagation). You can check propagation at [dnschecker.org](https://dnschecker.org).
4. In Railway, leave the domain in place; the certificate will retry. Do **not** delete and re-add the domain repeatedly (Let's Encrypt limits how often you can do that).

---

## 5. Optional: Cloudflare / proxy

If you use **Cloudflare** (or another proxy) in front of Railway:

- **SSL/TLS** mode should be **Full** or **Full (strict)** so the browser gets a valid certificate.
- DNS can stay as CNAME to Railway; the proxy IPs shown in DNS tools are normal.

---

## Quick checklist

| Step | Action |
|------|--------|
| 1 | Use **https://**mile12warrior.com (and https://www if you use www). |
| 2 | Railway → Settings → Domains: confirm domain status is **Valid** / **Active**. |
| 3 | If status is **Issuing**, wait 1–72 hours; avoid removing/re-adding the domain. |
| 4 | If **Failed**, fix DNS in Hostinger to match Railway’s CNAME/target, then wait. |
| 5 | Hard refresh (Ctrl+F5), try another browser, and bookmark the **https** URL. |

Once the certificate shows **Valid** in Railway and DNS is correct, the “connection not secure” warning should go away when using **https://**mile12warrior.com.
