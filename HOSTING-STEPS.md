# What You Need to Do (Plain Steps)

**Your situation:**
- **mile12warrior.com** = your domain. It currently shows a **WordPress** site.
- That WordPress site is **hosted on Hostinger** (you edit it in WordPress, Hostinger runs it).
- **This project** (the Driver Shield site we built) only exists on **your computer** right now. It is **not live** anywhere.

**What you want:**
- When people go to **mile12warrior.com**, you want them to see **this** site (Driver Shield), not WordPress.

---

## Why you can’t “just point” the domain to your computer

The site we built is a **Node.js app**. For the world to see it, it has to run on a **server on the internet** that is on 24/7. Your own PC is not that server (and Hostinger’s normal WordPress hosting can’t run Node.js). So you need **one place on the internet** that can run this Node app.

---

## What you need to do (3 steps)

### Step 1 — Get a place that can run this Node.js site

You need **one** host that can run Node.js. You don’t have to move your domain away from Hostinger for registration; you’ll only **point** the domain to this new place in Step 3.

**Easiest (free to start):**

- **Render.com**  
  - Sign up (free).  
  - “New + Web Service”. Connect your GitHub (or upload this project).  
  - Start command: `npm start`.  
  - They’ll give you a URL like `something.onrender.com`.  
  - In the service settings, add a **custom domain**: `mile12warrior.com` and `www.mile12warrior.com`. Render will tell you what to put in DNS (usually a CNAME or an A record).

- **Railway.app**  
  - Same idea: sign up, create a project, deploy this app (from GitHub or upload).  
  - Add custom domain `mile12warrior.com`.  
  - They’ll show you the DNS records to use.

**Or stay with Hostinger but upgrade:**

- If you have or buy a **Hostinger VPS** (not shared hosting), you can run this Node app on that VPS and point mile12warrior.com to the VPS IP. Shared WordPress hosting on Hostinger **cannot** run this app.

So: **Step 1 = sign up for Render (or Railway, or a Hostinger VPS) and deploy this project there.** After that, you’ll have a “new host” in the sense of “a server that runs this app.”

---

### Step 2 — Deploy this project to that place

- If you use **Render or Railway**: connect your GitHub repo (or upload the folder), set start command to `npm start`, and add the custom domain `mile12warrior.com` (and `www`) in their dashboard.
- If you use a **Hostinger VPS**: you’d upload the project, run `npm install` and `npm start`, and use something like PM2 so it keeps running. Then you’d point the domain to the VPS IP.

Once Step 2 is done, your Driver Shield site will be **live** at the URL they give you (e.g. `yourapp.onrender.com`). It won’t be on mile12warrior.com until you do Step 3.

---

### Step 3 — Point mile12warrior.com to that place (change DNS at Hostinger)

- Log in to **Hostinger**.
- Go to **Domains** → **mile12warrior.com** → **DNS Zone** (or **Manage DNS**).
- **Render/Railway** will have told you what to enter (e.g. “CNAME for www to `yourapp.onrender.com`” and “A record for @ to this IP”).
- In Hostinger’s DNS, **change** the existing A records (and add CNAME if they ask) so that:
  - `@` (root) points to the **IP** (or target) Render/Railway gave you.
  - `www` points to what they said (CNAME or same IP).
- Save. Wait 5–60 minutes (sometimes longer). After that, **mile12warrior.com** will show this Driver Shield site instead of WordPress.

You are **not** moving the domain to a new registrar; you’re only changing **where the domain points** (from Hostinger’s WordPress server to the server running this app).

---

## Short summary

| Step | What to do |
|------|------------|
| **1** | Choose a place that runs Node.js: e.g. **Render.com** (free) or **Railway**, or a Hostinger VPS. |
| **2** | Deploy **this project** there (connect repo or upload, `npm start`, add custom domain in their dashboard). |
| **3** | In **Hostinger**, open DNS for mile12warrior.com and change the A/CNAME records to what that host told you. |

After Step 3, you **keep** the domain name mile12warrior.com, but it will show the site we built here instead of WordPress. The WordPress site will still exist on Hostinger until you cancel or remove it; the domain will simply no longer point to it.

If you tell me which you prefer (e.g. “I’ll use Render”), I can give you click-by-click steps for that one only.
