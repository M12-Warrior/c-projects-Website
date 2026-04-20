---
name: Trucker GUI interactive theme
overview: Shift the site’s dark theme from asphalt to concrete grays, add trucking- and CB-themed animations and micro-interactions, and weave CB lingo into section labels and UI copy so the GUI feels built for truckers; animations stay professional and fun without distracting, and the general layout is unchanged.
todos: []
isProject: false
---

# Trucker-Focused Interactive GUI and Concrete Theme

## Current state

- **Theme:** Single dark theme in [public/css/main.css](public/css/main.css) — `:root` uses “asphalt” grays (`--bg: #1a1a1a`, `--bg-alt: #222222`, `--surface: #252525`, etc.) with gold/chrome accents. No theme toggle.
- **Animations:** Hero float glows, gradient-shift on title, pulse-dot badge, scroll-hint bounce, phase panel `panelIn`, scroll-reveal (`.reveal`/`.visible` in main.css + [public/js/main.js](public/js/main.js)), stat counters, and hover transforms on cards/buttons.
- **Structure:** Homepage sections — hero, roadmap (7 phase tabs), resources, packets, community. Phase topics: Sleep & Fatigue, Physical Health, Mental Wellness, Road & Weather, Defensive Driving, Emergency Prep, Action Plan.
- **Copy:** Hero already uses “1 Social Butterfly” (CB term). Section tags are neutral (“The Full Picture”, “Resources”, “Free Downloads”, “The Mile 12 Community”).

---

## 1. Dark mode: asphalt → concrete palette

**Goal:** Replace the current asphalt-black base with a concrete-inspired dark gray (cooler, slightly lighter) while keeping contrast and gold/chrome accents.

**File:** [public/css/main.css](public/css/main.css)

- In `**:root`**, replace the five base variables with concrete-style values (e.g. `--bg: #2c2c2e`, `--bg-alt: #363638`, `--surface: #3e3e42`, `--surface-2: #48484c`, `--surface-3: #525258`). Tweak to meet contrast (WCAG) and visual preference; concrete reads as a lighter, cooler gray than asphalt.
- Update the **header comment** (lines 1–4) from “Asphalt black, safety gold, chrome” to “Concrete gray, safety gold, chrome”.
- Update the **inline comment** “Asphalt black (road / base)” to “Concrete (road / base)”.
- **Hero mesh** (line 226): change `rgba(26,26,26,…)` to the new `--bg` equivalent (e.g. `rgba(44,44,46,…)`) so the gradient matches the new base.
- **Navbar** (lines 109–118): replace `rgba(26, 26, 26, …)` with the same concrete base so the nav doesn’t look like old asphalt when scrolled.
- **Mobile app:** [mobile-app/www/css/app.css](mobile-app/www/css/app.css) uses a different palette (blue accent). Decide whether to align it with the new concrete/gold theme in this pass or in a follow-up; the plan assumes main site first, mobile optional.

**Docs:** In [IMAGES.md](IMAGES.md) and [RAILWAY.md](RAILWAY.md), replace “asphalt black” with “concrete gray” (or equivalent) where brand colors are described.

---

## 2. Trucking- and CB-themed animations

**Goal:** Make the GUI feel more interactive and trucking-specific with subtle, on-theme motion (road, rig, CB, mile markers) without overwhelming or distracting from content.

**2a) Scroll progress bar (road / mile marker)**

- **File:** [public/css/main.css](public/css/main.css) — `.scroll-progress` (lines 85–94).
- Option A: Keep the bar but style it like a **road stripe** (e.g. dashed or segmented look, optional very subtle “motion” via background-position animation).
- Option B: Add a **mile-marker** metaphor (e.g. small “Mile” label or tick marks that feel like counting up as you scroll). Implementation can be CSS-only (e.g. pseudo-element with gradient) or a small JS update in [public/js/main.js](public/js/main.js) to add a class/text when scroll crosses certain thresholds.
- Prefer lightweight CSS changes first; add JS only if you want dynamic “mile” numbers.

**2b) Hero**

- **Road / horizon:** Add a subtle **moving road line** or **horizon stripe** in the hero (e.g. thin horizontal line or dashed line with `background-position` or `translate` animation) to suggest “highway” without competing with the hero image.
- **Glows:** Existing `.hero-glow-1/2/3` already float; optionally rename or add a comment that they evoke “headlights” or “road lights” and leave timing as-is, or add a second, very subtle “headlight sweep” (e.g. a narrow gradient that moves horizontally once on load).
- **Scroll hint:** Replace “Scroll to explore” with CB/trucking phrase (e.g. “Roll on” or “Keep the shiny side up — scroll”) and, if desired, add a tiny **antenna** or **CB wave** icon next to the scroll line in CSS/HTML.

**2c) Phase tabs (CB channel / dispatch)**

- **File:** [public/css/main.css](public/css/main.css) — `.phase-tab`, `.phase-tab.active`, `.phase-tab:hover`.
- Add a short **tab switch animation**: e.g. when a phase tab is clicked, a quick “channel switch” or “click” feedback (scale or border pulse) and ensure panel transition stays smooth (`panelIn` already exists).
- Optional: **Channel 19** nod — e.g. a small “Ch. 19” or channel icon on the roadmap section tag (visual only) or in the tab bar.
- **File:** [public/js/main.js](public/js/main.js) — in the phase-tab click handler, optionally add a one-off class for a “channel switch” animation (e.g. 150 ms scale) for extra feedback.

**2d) Section-specific motion (by topic)**

- **Sleep & Fatigue:** Optional very subtle **moon** or **bunk** icon animation (e.g. soft pulse or slight drift) on the phase tab or panel header for Phase 01.
- **Physical:** Optional **rig** or **weight** icon micro-motion for Phase 02.
- **Mental:** Optional **CB buddy** or **radio wave** hint (e.g. small wave icon that pulses) for Phase 03.
- **Road & Weather:** Optional **flashers** or **chain** icon (e.g. slow blink) for Phase 04.
- **Defensive:** Optional **eyes** or **scan** icon (e.g. slight move) for Phase 05.
- **Emergency:** Optional **flasher** or **checklist** tick animation for Phase 06.
- **Action Plan:** Optional **dispatch** or **clipboard** nod for Phase 07.

Implement via one shared “phase icon” or “tab icon” element per panel/tab and CSS keyframes; keep animations short and low-motion to avoid distraction. Prefer 1–2 signature moves (e.g. roadmap tab + hero road line) if scope is tight.

**2e) Scroll-reveal**

- **File:** [public/css/main.css](public/css/main.css) — `.reveal` / `.reveal.visible` (lines 1773–1781).
- Optionally add a **stagger** or **direction** variant (e.g. “reveal from left” for resource pills, “reveal from bottom” for cards) so different sections feel slightly different; current stagger is already applied in JS via `data-delay`. No need to change JS unless you add new reveal classes.
- Optional: name keyframes with trucking flair (e.g. `roadReveal` instead of generic `translateY`) for maintainability.

**2f) Cards and buttons**

- Existing hover `translateY` and transitions are good. Optionally add a very subtle **shine** or **chrome** pass on primary buttons (e.g. gold gradient shift on hover) to reinforce “trucker chrome” without changing layout.
- **Back-to-top:** Optional “back to the cab” or “back to the top” label with a small truck or arrow icon; keep behavior the same.

---

## 3. CB lingo and copy

**Goal:** Use CB and trucker terms where they feel natural (section tags, hints, labels) without changing regulatory or safety wording.

**3a) Section tags and headings**

- **Roadmap:** “The Full Picture” → e.g. “Copy That — The Full Picture” or “Breaker 1-9 — The Full Picture”.
- **Resources:** “Resources” → e.g. “Land Line — Resources” (land line = phone / fixed resource).
- **Packets:** “Free Downloads” → e.g. “Manifest — Free Downloads” or “Paperwork — Free Downloads”.
- **Community:** “The Mile 12 Community” → e.g. “Convoy — The Mile 12 Community” or “Good Buddies — The Mile 12 Community”.
- **Hero badge:** Already has “1 Social Butterfly”; can add “Driver Shield” or “10-4” style phrase if it fits the badge.

**3b) UI micro-copy**

- **Scroll hint:** “Scroll to explore” → “Roll on” or “Keep the shiny side up” (with optional “scroll” in smaller text).
- **CTA buttons:** Keep “Explore the Roadmap” / “Our Services”; optional secondary line like “10-4” or “Copy that” on a key CTA if it doesn’t clutter.
- **Phase tabs:** Labels can stay as-is (Sleep & Fatigue, etc.); optional “Ch. 01” style prefix only if it doesn’t hurt readability.
- **Forum CTA:** “Get Started — Join the Forum” can stay or become “Join the Convoy — Forum” (or similar).

**Files:** [public/index.html](public/index.html) for hero, section headers, roadmap tabs, resources, packets, community, and footer if any matching copy lives there. Use find-and-replace or targeted edits so only the chosen phrases change; do not alter FMCSA/regulatory or disclaimer text.

---

## 4. CB radio visual nods (optional)

**Goal:** Light visual references to CB radios (channel, signal, “over”) without a full skeuomorphic radio.

- **Section tags:** Add a small **radio wave** or **antenna** SVG icon next to 1–2 section tags (e.g. “The Full Picture” or “Convoy”).
- **Roadmap:** Small “Ch. 19” or channel icon near the phase tabs (CSS + one small inline SVG or icon font).
- **Footer or nav:** Optional tiny “CB” or radio icon in the footer next to “Contact” or “Mile 12 Warrior” (one place only).
- **Static / signal:** Avoid heavy static or noise textures (accessibility and motion sensitivity). If anything, a single very subtle “signal bar” (e.g. 1–3 vertical bars that gently pulse on hero or roadmap) in CSS only; keep it minimal.

**Files:** [public/index.html](public/index.html) for new icons (inline SVG or `img`), [public/css/main.css](public/css/main.css) for layout and animation of icons.

---

## 5. Implementation order and scope

- **Phase 1 (foundation):** Concrete palette in `main.css` + hero mesh + navbar; update IMAGES.md/RAILWAY.md.
- **Phase 2 (motion):** Scroll progress (road/mile), hero road line, phase tab “channel” feedback, then 1–2 section-specific icon animations (e.g. roadmap + community).
- **Phase 3 (copy):** CB lingo in section tags and scroll hint in `index.html`; leave regulatory and disclaimer text unchanged.
- **Phase 4 (optional):** CB visual nods (section-tag icon, Ch. 19, optional signal bar); mobile app theme alignment if desired.

**Compliance:** Animations and CB lingo are presentational only. Do not change substantive safety, HOS, or regulatory content; keep FMCSA/CALDOT references and disclaimers per workspace rules.

---

## 6. Files to touch (summary)


| Area              | Files                                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Concrete theme    | [public/css/main.css](public/css/main.css) (`:root`, hero-mesh, navbar), [IMAGES.md](IMAGES.md), [RAILWAY.md](RAILWAY.md)                                                              |
| Animations        | [public/css/main.css](public/css/main.css) (scroll bar, hero road line, phase tab/panel, reveal, optional phase icons), [public/js/main.js](public/js/main.js) (optional tab feedback) |
| CB copy           | [public/index.html](public/index.html) (section tags, hero badge, scroll hint, CTAs)                                                                                                   |
| CB visuals        | [public/index.html](public/index.html) (inline SVGs or icon refs), [public/css/main.css](public/css/main.css) (icon layout/animation)                                                  |
| Mobile (optional) | [mobile-app/www/css/app.css](mobile-app/www/css/app.css)                                                                                                                               |


No new dependencies; stick to vanilla CSS and existing JS.