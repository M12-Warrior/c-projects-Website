---
name: Nav search and back
overview: Fix the broken mobile menu by removing duplicate nav-toggle listeners where `main.js` already runs, align cart badge storage with the rest of the shop, then add a global GET search (static routes + blog + shop via existing APIs), a back control with safe fallback, and normalize the full nav (including refresh) across pages. In Admin, add a three-dot overflow control on product/shop images to upload or edit images (covers packets and merchandise rows in the same products table).
todos:
  - id: fix-main-js
    content: "navAuth + cart key + Search link injection (main.js). Optional initNavBack not added"
    status: completed
  - id: dedupe-listeners
    content: "Audited 2026-04: no navToggle click handlers in views; mobile menu handled by public/js/main.js only"
    status: completed
  - id: nav-markup-css
    content: Add canonical nav with back + search form; main.css layout; fix refresh.html Home link; batch HTML updates
    status: pending
  - id: search-route-page
    content: "GET /search + views/search.html; blog + shop APIs + static routes (2026-04)"
    status: completed
  - id: verify-mobile-nav
    content: Smoke-test ≤768px hamburger on course, login, forum, and search pages
    status: pending
  - id: admin-product-image-overflow
    content: "Admin Shop: three-dot menu on product image thumbnails + upload via /api/upload + URL edit; extend New Product form with upload"
    status: pending
isProject: false
---

# Site navigation: search, back, and working hamburger menu

## Root cause of the hamburger issue

`[public/js/main.js](public/js/main.js)` registers the mobile menu on `DOMContentLoaded` (toggle `.open` on `#navLinks`, close on link click). Many view templates **also** register the same toggle in an inline `<script>` **before** `main.js` loads. Two listeners each fire once per click, so the menu **toggles twice** and appears stuck closed.

This affects many files (e.g. `[views/course.html](views/course.html)` lines 1222–1230 plus `<script src="/js/main.js">`, `[views/login.html](views/login.html)` lines 185–212, `[views/about.html](views/about.html)` lines 241–248, `[views/services.html](views/services.html)`, `[views/profile.html](views/profile.html)`, `[views/refresh.html](views/refresh.html)`, etc.). Pages that only include `main.js` for nav (e.g. `[views/forum.html](views/forum.html)`) are already fine.

**Fix:** On every page that loads `main.js`, remove the **duplicate** nav-toggle block (and, where it only exists to support that, the redundant scroll/navbar copy that duplicates `main.js`). Keep page-specific scripts that are still needed (e.g. course module logic, login form, per-page auth helpers) but strip duplicated **scroll + nav toggle** when `main.js` is present.

**Also remove** redundant per-page `updateAuthLink` / cart badge IIFEs where they duplicate `main.js` **after** confirming a single consistent behavior (see cart key below).

## Cart badge consistency (nav “full experience”)

`[public/js/main.js](public/js/main.js)` reads `localStorage` key `driverShieldCart`, while the shop/cart flows use `driver_shield_cart` (e.g. `[views/shop.html](views/shop.html)`, `[views/cart.html](views/cart.html)`). `**main.js` should use `driver_shield_cart`** so the header cart count matches the rest of the site.

## `navAuth` safety

`[public/js/main.js](public/js/main.js)` (around 413–418) sets `navAuth.innerHTML` when `data.user` exists but never checks `navAuth`. Pages like login/register use `navSignInWrap` / `navUserWrap` instead of `navAuth`, so a logged-in user could throw. **Guard with `if (data.user && navAuth)`** before mutating.

---

## Back navigation

- Add a **Back** control in the header (e.g. `#navBack` button with `aria-label="Go back"`), placed in `[public/css/main.css](public/css/main.css)` so it aligns with the existing navbar tokens (`--gold`, `--ease`, etc.).
- Initialize in `main.js`: prefer `history.back()` when there is usable history; **fallback to `/`** when there is no in-site history (e.g. opened in a new tab or direct entry). A practical pattern is: if `history.length > 1` **or** `document.referrer` is same-origin, call `history.back()`, else `location.href = '/'`.
- **Hide on the homepage** only: `main.js` can hide `#navBack` when `location.pathname` is `/` (and optionally treat `/index.html` if ever used).

No separate “back” per inner page is required if the control is global.

---

## Search

**Behavior**

- Add **GET** `[/search](server.js)` serving a new `[views/search.html](views/search.html)` using the same shell as other inner pages (`grain-overlay`, `scroll-progress`, `main.js`, `.page-shell`, shared nav/footer pattern per `[.cursor/rules/gui-animations.mdc](.cursor/rules/gui-animations.mdc)`).
- **Nav search:** a `<form method="get" action="/search" role="search">` with `name="q"` so it works **without JavaScript**. Optional: `input type="search"` with `aria-label="Search site"`.
- **Search page:** read `q` from the query string. Build results from:
  1. A **static list** of main site routes and labels (Home, About, Services, Blog index, Forum, Shop, Cart, Contact, Course, Journal, Legal pages, etc.) — match title/path/description with a simple case-insensitive substring test.
  2. **Blog:** `fetch('/api/blog/posts')` (already public in `[routes/blog.js](routes/blog.js)`) and filter by title (and optionally excerpt if returned).
  3. **Shop:** `fetch('/api/shop/products')` and filter by name/description.
- Render results as links in the existing card styles (`.glass-card` / `.blog-card`-like) and call `window.refreshReveal()` after injecting if using reveal classes.
- Include the standard **educational disclaimer** copy in the footer area consistent with other pages.

**Routing:** add `app.get('/search', ...)` in `[server.js](server.js)` next to other page routes.

**CSS:** nav search width and mobile wrapping in `[public/css/main.css](public/css/main.css)` (max-width, flex, breakpoint behavior so the hamburger + search + back do not overlap). Respect `prefers-reduced-motion` for any dropdown animation if you add one.

---

## Full menu everywhere

- Use **one canonical `<nav>` block** (logo + back + search form + toggle + full `<ul id="navLinks">` including Home, About, Services, Roadmap `/#roadmap`, Blog, Forum, Shop, Cart + `#cartBadge`, Refresh, Contact, `#navAuth` or auth-specific rows) copied from `[public/index.html](public/index.html)` / `[views/forum.html](views/forum.html)`.
- `**[views/refresh.html](views/refresh.html)`** currently omits **Home** in the list; add it so the mobile drawer matches the rest of the site.
- Apply the same nav markup update across **all** public templates that show the main navbar (including `[public/index.html](public/index.html)`, `[views/*.html](views)` except print-only / special cases like `[views/journal-print.html](views/journal-print.html)` if it intentionally differs).

---

## Files to touch (high level)


| Area              | Files                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core behavior     | `[public/js/main.js](public/js/main.js)` — single nav init, back button, `navAuth` guard, cart key, optional `aria-expanded` on toggle                                |
| Styles            | `[public/css/main.css](public/css/main.css)` — `.nav-back`, `.nav-search`, flex tweaks for `.nav-container` at 768px                                                  |
| Route + page      | `[server.js](server.js)`, new `[views/search.html](views/search.html)`                                                                                                |
| Dedupe + nav HTML | `[public/index.html](public/index.html)`, `[views/*.html](views)` with shared navbar (batch update + remove duplicate inline nav-toggle/scroll where `main.js` loads) |
| Course            | `[views/course.html](views/course.html)` — remove duplicate nav block from the large inline script; keep `main.js`                                                    |
| Admin shop images | `[views/admin.html](views/admin.html)` — product image overflow menu, upload + PATCH product; New Product upload parity with blog                                     |


---

## Verification checklist

- At **≤768px**, hamburger opens the **full** link list once; tap a link closes the menu.
- **Back** returns to the previous in-site page or **home** when no history.
- **Search** form submits to `/search?q=` with JS disabled; results show matching pages, blog posts, and products.
- **Cart badge** updates with items added from shop using `driver_shield_cart`.
- **Reduce motion:** no new disruptive motion on nav/search.

---

## Admin: easier image changes (three-dot menu on shop items)

**Context:** In `[views/admin.html](views/admin.html)`, **Shop → products** already stores an `image` URL per row (packets, course bundles, and physical merchandise are all `products` in the DB). Today:

- The product table shows a small thumb and an **Edit image** button that opens `[#productEditModal](views/admin.html)` with **URL only** (no upload).
- **New Product** uses the same URL-only field.
- **Blog** in the same admin already uses **Upload image** → `POST /api/upload` (`[routes/upload.js](routes/upload.js)`) and fills the URL field.

**Goal:** Put a **three-dot overflow control** (vertical kebab ⋮ — the common “more actions” pattern; if you prefer a 9-dot grid icon for brand consistency, the same menu can use that glyph) on each product’s image cell so admins can:

1. **Upload new image** — hidden file input → `POST /api/upload` with `credentials: 'include'` → set image URL → `PUT/PATCH` product via existing `[/api/shop/products/:id](routes/shop.js)` (same as current save).
2. **Edit image URL** — open the existing modal or an inline field (current behavior).
3. **Remove image** (optional) — clear URL and save, with confirm.

**UI sketch:** Wrap each thumb in a small container (`position: relative`) with a corner overlay button `aria-label="Image options"`, `aria-haspopup="true"`, toggling a **dropdown** (keyboard: Escape to close, focus trap if feasible). Reuse admin button / surface tokens so it matches the rest of `[admin.html](views/admin.html)`.

**New product form:** Add the same **Upload image** + URL pattern as blog (file input + auto-fill), not only manual URL.

**Scope note:** “Packets” and “merchandise” do not need separate admin tables for images if they are shop **products**; one improved **Products** grid covers them. Blog featured images already have upload — no change required unless you want the same three-dot pattern there later (out of scope unless requested).

**Files:** Primarily `[views/admin.html](views/admin.html)` (markup + JS for dropdown, upload, PATCH); optional small CSS block for `.admin-image-menu` / dropdown. No new API if `/api/upload` and product update routes remain sufficient.

**Accessibility:** Button must be keyboard-focusable; menu items as buttons or links; `aria-expanded` on the trigger when open.

---

## Verification checklist (admin add-on)

- From Admin → Shop, **three-dot** menu on a product row opens; **Upload** replaces the image and persists after refresh.
- **Edit URL** still works; optional **Remove** clears the image.
- **New Product** can be created with upload-only (no paste) like Blog.

