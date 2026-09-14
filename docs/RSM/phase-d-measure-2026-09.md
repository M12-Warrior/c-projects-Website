# Phase D — Measure before guessing
**Date:** September 2026  
**Owner:** Joyce / Mile 12 Warrior  
**Status:** Ready when Phase C owner steps are underway (can start baseline now)

Phase D from the Cursor SEO helper:

> Baseline: indexed pages, top queries, clicks, Core Web Vitals. Revisit in 30/60/90 days.

Do **not** change strategy from one cold week of data. Use this sheet as the source of truth.

---

## Unlock gate (must be true before circle-back publishes Month-1 cadence)

| Phase | Status | Remaining |
|-------|--------|-----------|
| A — technical foundation | **Done** (live) | None |
| B — long-tail content + hub FAQs | **Done** (live) | None |
| C — Bing / citations / LinkedIn | **Bing connected** + IndexNow live | Ongoing: LinkedIn article posts + citations |
| D — measure baseline | **Started** (dates + lab baseline + GA4) | Fill GSC clicks/impressions when convenient; GA4 `G-E2E8MV3M2W` on site |
| Cadence 2–4/month | **Month-1 PUBLISHED** | `PUBLISH_CADENCE_MONTH1 = true` — circle-back complete for first month |

**Do not publish Month-1 cadence until C owner essentials + D baseline sheet are started.**

---

## Lab / crawl baseline (agent-filled 2026-09-13 — not GSC field data)

| Check | Result |
|-------|--------|
| Sitemap URL count | **34** `<loc>` entries at `https://mile12warrior.com/sitemap.xml` (2026-09-13) |
| Key Phase A–B URLs HTTP status | All **200**: `/`, `/packets/new-driver`, `/course`, HOS + split sleeper + CA chains blogs (rechecked 2026-09-13) |
| PageSpeed Insights API | Quota exhausted from agent environment — Joyce: run [PageSpeed](https://pagespeed.web.dev/) on home + `/packets/new-driver` and paste scores |
| GSC clicks / queries | Owner-only (`mile12warrior@gmail.com`) — fill from Search Console |
| Bing | **Connected** (Webmaster dashboard live Sep 13, 2026) — submit `https://mile12warrior.com/sitemap.xml` if not yet listed; reports may take up to 48h |
| NAP schema deploy | Live: Organization on home + ProfessionalService on `/contact` |
| Month-1 cadence | 3 posts staged in `db/blog-posts-cadence-month1.js` — **not** in live sitemap until unlock |

See also: [`content-cadence-month1-ready.md`](./content-cadence-month1-ready.md) · [`content-cadence-month1-drafts.md`](./content-cadence-month1-drafts.md)

| Metric | Where to look | Date: ______ | Value |
|--------|---------------|--------------|-------|
| Indexed pages (approx) | GSC → Pages / Indexing | | |
| Sitemap URLs submitted | GSC → Sitemaps | | `https://mile12warrior.com/sitemap.xml` |
| Total clicks (28 days) | GSC → Performance | | |
| Total impressions (28 days) | GSC → Performance | | |
| Top 5 queries | GSC → Performance → Queries | | |
| Top 5 landing pages | GSC → Performance → Pages | | |
| Bing impressions/clicks | Bing Webmaster → SEO Reports | | |
| LCP / INP / CLS (mobile) | GSC → Experience → Core Web Vitals, or PageSpeed Insights | | |

### Priority URLs to watch (Phase A–B work)

- `/` homepage  
- `/packets/new-driver`  
- `/course`  
- `/blog/hours-of-service-rest-for-truck-drivers`  
- `/blog/split-sleeper-berth-explained-for-truck-drivers`  
- `/blog/california-chain-laws-for-truckers`  
- `/shop`  
- `/packets/fleet-new-hire`

For each, note: indexed? impressions? clicks? (even if zero — zeros are a valid baseline).

---

## Core Web Vitals (quick check)

1. Open [PageSpeed Insights](https://pagespeed.web.dev/)  
2. Test `https://mile12warrior.com/` and one inner hub (`/packets/new-driver`)  
3. Record mobile LCP, INP, CLS  
4. If something is “Poor,” paste the URL + score here and we will fix in-repo (images, JS, fonts) — do not guess from one lab run alone; prefer GSC field data when it appears

---

## Revisit calendar

| Checkpoint | Date | What to compare |
|------------|------|-----------------|
| Baseline | **2026-09-13** (started — Bing connected; fill GSC numbers tonight if possible) | Table above |
| +30 days | **2026-10-13** | Same metrics + which Phase B URLs gained impressions |
| +60 days | **2026-11-12** | Queries / pages trending; citation / LinkedIn activity effect |
| +90 days | **2026-12-12** | Decide next content cluster; Month-1 cadence should already be live by then |

---

## Rules for decisions

1. **Search Console / Bing > gut feel** and > cold SEO sales email.  
2. One week of low clicks is normal for new URLs — wait for the 30-day mark before rewriting strategy.  
3. Fix clear technical issues immediately (crawl errors, soft 404s, www slips).  
4. Content bets: double down on URLs that get impressions; do not abandon brand hubs because a broad head term is competitive.

---

## Done when

- [x] Bing Webmaster connected (`mile12warrior.com` dashboard live)
- [ ] Baseline table filled once (at least GSC clicks/impressions + Bing sitemap submitted)
- [x] 30/60/90 dates on calendar (2026-10-13 / 11-12 / 12-12)
- [ ] PageSpeed notes for home + one hub (Joyce paste)
- [ ] Joyce ready to resume **2–4 posts/month** cadence (circle-back goal) → flip `PUBLISH_CADENCE_MONTH1`
