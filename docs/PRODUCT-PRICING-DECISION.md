# Product pricing decision (locked)

**Date:** 2026-08-09  
**Owner:** Mile 12 Warrior LLC  
**Status:** Decided — implement when checkout is unpaused (`CHECKOUT_PAUSED=false` on Railway)

## Principle
Keep the mission-critical basics free. Charge for deeper individual training and fleet tools. Merch/gear when the shop is ready.

## Always free (no checkout)
| Asset | Notes |
|-------|--------|
| Tier 1 — New Driver Packet | $0 in products DB |
| 7 focus-area / roadmap checklists | Homepage emergency + phase checklists |
| Daily Trucker Wellness Journal (+ related checklists) | Free download/print; optional free account for My Journal extras |

## Paid when checkout is live
| Product | Catalog price | Role |
|---------|---------------|------|
| 90-Day Onboarding Course | $149 | Main individual paid offer (includes New Driver Packet) |
| Seasoned Driver Packet | $29 | Individual upsell |
| Fleet New Hire Orientation Packet | $79 | B2B |
| Fleet Seasoned Driver Refresher Packet | $79 | B2B |
| Fleet Bundle (New Hire + Refresher) | $129 | B2B bundle |
| Complete Bundle (Course + all packets) | $249 | Full package |
| Merch / drivers gear | TBD | Turn on with shop — not required for digital checkout |

## Not required
- Creating matching Products inside the Stripe Dashboard catalog (site sends `price_data` from our DB)

## Go-live checklist (when ready)
1. [ ] Stripe bank verified + default payout set  
2. [ ] Railway: live Stripe keys + webhook secret + `BASE_URL=https://mile12warrior.com`  
3. [x] Product prices sync on boot from DB (`docs/PRODUCT-PRICING-DECISION.md`)  
4. [x] Public copy updated for free-forever vs paid catalog (Services / Home / Course / Shop)  
5. [ ] Set Railway `CHECKOUT_PAUSED=false` and redeploy  
6. [ ] Test one small live or test-mode purchase end-to-end  

## While still paused
Site still offers all digital training free (`freeAccess` tied to pause). Catalog prices are shown as “FREE now · $XX” so drivers see the model before checkout opens.
