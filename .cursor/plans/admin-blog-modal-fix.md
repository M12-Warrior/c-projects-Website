---
title: Admin blog modal and New Post behavior
description: Fix unclosable Edit post modal, New Post initiation, add draggable/resizable edit modal with X, Escape, and backdrop close.
scope: views/admin.html, public/css/pages.css
element_ids:
  - blogEditModal
  - blogEditCancel
  - blogEditScheduledAt
  - blogEditPublishBtn
  - blogNewPostBtn
  - blogNewFormWrap
  - blogNewCancelBtn
deliverables:
  - blogEditModal closable via Cancel, X button, Escape, backdrop click
  - blogEditModal draggable and resizable with visible X close
  - New Post (blogNewFormWrap) show/hide behavior correct and optionally URL-driven
  - Styles for modal and dialog in public/css/pages.css
  - No new JS files; all logic in views/admin.html inline script
---

# Admin blog modal and New Post — implementation outline

## 1. blogEditModal structure (views/admin.html)

- **Backdrop vs content:** Split `#blogEditModal` into a backdrop wrapper (full-screen, click-to-close) and an inner dialog box. Add a single inner wrapper (e.g. `id="blogEditDialog"`) that holds the form and is the draggable/resizable element. Keep `#blogEditModal` as the overlay (position:fixed; inset:0; flex center; z-index).
- **X close button:** Add a visible close control inside the dialog header, e.g. `<button type="button" id="blogEditClose" class="blog-modal-close" aria-label="Close">×</button>`, and bind it to the same close function as `#blogEditCancel`.
- **IDs to keep:** `blogEditModal`, `blogEditCancel`, `blogEditScheduledAt`, `blogEditPublishBtn` (all already present). Use `blogEditDialog` (new) for the inner draggable panel.

## 2. Closing behavior (views/admin.html inline script)

- **Single close function:** Use one `closeBlogEdit()` that: removes `hidden` from `#blogEditModal`’s display logic (ensure hidden = not visible), clears form fields (`blogEditId`, `blogEditTitle`, `blogEditExcerpt`, `blogEditImageUrl`, `blogEditContent`, `blogEditScheduledAt`), and optionally resets drag position/size for next open.
- **Bind all closers to that function:**
  - `#blogEditCancel` (existing) → `closeBlogEdit`
  - `#blogEditClose` (new X button) → `closeBlogEdit`
  - Backdrop: on `#blogEditModal` click, if `e.target === blogEditModal` then `closeBlogEdit()` (stop propagation on dialog so clicks inside don’t close).
  - Escape: document keydown listener when modal is open; if `e.key === 'Escape'` and `#blogEditModal` is visible, call `closeBlogEdit()` and remove the keydown listener when closed (or use a single delegated listener that checks visibility).

## 3. New Post initiation (views/admin.html)

- **Existing IDs:** `#blogNewPostBtn` shows `#blogNewFormWrap`; `#blogNewCancelBtn` hides `#blogNewFormWrap`. Ensure handlers run after DOM ready and are not overwritten (they already exist; verify no duplicate IDs or script order issues).
- **Optional URL param:** On init, if `?tab=blog` and `?new=1` (or `&new=1`), after switching to Blog tab and calling `loadBlog()`, call the same logic as `#blogNewPostBtn` click (e.g. `#blogNewFormWrap.classList.remove('hidden')`) so “New Post” form opens when landing on admin with `?tab=blog&new=1`.

## 4. Draggable and resizable (views/admin.html inline script)

- **Draggable:** On `#blogEditDialog` (inner wrapper), implement drag-by-header: mousedown on a designated header area (e.g. the row containing “Edit post” and the X button) sets a flag and records offset; mousemove (document) updates `blogEditDialog`’s `left`/`top` (position the dialog with `position:fixed` and pixel values); mouseup clears flag and removes document listeners. Ensure drag only when modal is open and cursor is on the header.
- **Resizable:** Add a resize handle (e.g. bottom-right corner or edge) on `#blogEditDialog`. On mousedown, record initial width/height and mouse position; on mousemove update width/height (with min/max so the dialog stays usable). Use CSS `resize` and `overflow:auto` on the dialog as a simple alternative, or implement manual resize with a handle for consistency.

## 5. CSS (public/css/pages.css)

- **Modal overlay:** Class for the blog edit overlay (e.g. `.blog-edit-modal-overlay` on `#blogEditModal`) so inline styles can be moved: fixed, inset 0, flex center, backdrop background, z-index 100, overflow-y auto, padding. When `.hidden` is applied, `display: none` (existing `.hidden` rule).
- **Dialog panel:** Class for `#blogEditDialog`: fixed positioning (or relative to overlay), min/max width and height, background, border-radius (e.g. `var(--radius)`), so it can be dragged and resized. Header row with title and X button (flex, space-between). Style the X button (`.blog-modal-close`) so it’s clearly visible (size, color, hover).
- **Resize:** Either `.blog-edit-dialog { resize: both; overflow: auto; }` with min-width/min-height, or a dedicated resize-handle class with cursor and hit area.

## 6. Verification

- **Edit modal:** Open via table “Edit”; close with Cancel, X, Escape, and backdrop click; reopen and confirm form is cleared and draggable/resizable work.
- **New Post:** Click “New Post” → form visible; Cancel → form hidden. With `?tab=blog&new=1`, form is visible after load.
- **IDs:** All of `blogEditModal`, `blogEditCancel`, `blogEditScheduledAt`, `blogEditPublishBtn`, `blogNewPostBtn`, `blogNewFormWrap`, `blogNewCancelBtn` remain in use; add only `blogEditClose` and `blogEditDialog` where specified.
