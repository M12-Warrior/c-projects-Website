# Backup plan: apex DNS via Cloudflare (if Northwest cannot ALIAS)

**When to use:** Northwest / Business Identity cannot set CNAME/ALIAS/ANAME on `@` for `mile12warrior.com`, and Railway will not provide a static A-record IP.

**Goal:** Keep the domain registered where it is; move **DNS only** to Cloudflare so apex CNAME flattening works for Railway.

## Steps (owner)
1. Create a free Cloudflare account → Add site `mile12warrior.com`.
2. Cloudflare will show two nameservers (e.g. `ada.ns.cloudflare.com`).
3. Ask Northwest to **update nameservers only** to Cloudflare’s pair (or change them in the registrar panel if you have access).
4. In Cloudflare DNS (proxy **DNS only / gray cloud** per Railway):
   - CNAME `@` → current Railway target for apex (from Railway DNS panel)
   - CNAME `www` → current Railway target for www
   - Keep both `_railway-verify` TXT records Railway shows
5. Wait for Railway domains to show verified / green.
6. Test https://mile12warrior.com and https://www.mile12warrior.com in a private window.

## Do not
- Point apex at a guessed Railway IP (brittle; caused the Aug 2026 Forbidden issue).
- Leave Cloudflare proxy orange unless Railway support says otherwise.

## Current Railway working URL (temporary)
https://c-projects-website-production.up.railway.app
