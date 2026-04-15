# Plan: Keyboard nav + mobile menu (completed)

## Goals

- Admin (and site patterns): move between tab-style controls with **Arrow** keys and **Home/End**, with visible **focus** styles.
- Mobile **hamburger**: menu usable when scrolled (no need to scroll to top); links open reliably.

## Implemented

- **`public/css/main.css`**: Higher navbar stacking (`z-index: 10050`); `pointer-events: none` on scroll progress; mobile `.nav-links` uses `pointer-events: none` when closed / `auto` when `.open`, plus `z-index` under navbar; `nav-toggle` `z-index: 2`; focus rings for `.nav-toggle` and `.phase-tab`; small screens: `.nav-links { top: 56px }` to match shorter header.
- **`public/js/main.js`**: Mobile nav `aria-expanded` / `aria-controls`, **Escape** closes menu; homepage **roadmap** tabs: `tablist`/`tab` roles, **Arrow Left/Right/Up/Down**, **Home/End**, reduced-motion-aware scroll.
- **`public/css/pages.css`**: `.admin-tab:focus-visible` ring.
- **`views/admin.html`**: Central `activateAdminTab`, `role="tablist"` + per-tab ARIA, same arrow/Home/End behavior; **removed** duplicate mobile nav wiring (main.js only) to avoid double-toggle.

## Deploy

Commit and push; no new env vars.
