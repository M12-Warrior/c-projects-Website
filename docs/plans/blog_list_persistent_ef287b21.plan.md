---
name: Blog list persistent
overview: Keep the Blog posts list visible at all times (no automatic modal opening on tab load) and add a dropdown to show 5 posts by default with an option to show the full list.
todos:
  - id: blog-modal-autoopen-stop
    content: In `views/admin.html`, disable/remove the init-time auto call `openBlogEdit(urlEditId)` so entering the Blog tab never auto-opens the edit modal. Keep `loadBlog()` on tab open.
    status: completed
  - id: blog-list-limit-dropdown
    content: In `views/admin.html`, add a `#blogListLimit` dropdown (default 5, option All) and update `loadBlog()` rendering to slice posts accordingly while keeping existing thumbnail and action buttons.
    status: completed
  - id: blog-newpost-proofread-hint
    content: In `views/admin.html`, update `#blogNewPostBtn` label to include a Proofread hint (e.g. `New Post (Proofread)`) while keeping the proofread reminder inside the New Post form.
    status: completed
isProject: false
---

## Goal
On `Admin -> Blog`, the **posts list table** (thumbnail/title/author/status/date/actions) should be visible immediately on tab open, without requiring you to click `Cancel`/close a popup. Also, the list should default to showing **5** newest posts with a dropdown to expand to the full list.

## Root cause to fix
In `views/admin.html`, the admin init code auto-opens the blog edit modal when `?tab=blog&edit=...` is present:
- `var urlTab = urlParams.get('tab');`
- `var urlEditId = urlParams.get('edit');`
- `if (urlEditId) setTimeout(function() { openBlogEdit(urlEditId); }, 400);`

This auto-opening hides the list until the modal is closed. We will stop this auto-open behavior.

## Implementation details

### 1) Stop automatic edit modal open on Blog tab
- File: `views/admin.html`
- Change: In the `(async function init() { ... })()` block, remove or disable the `if (urlEditId) ... openBlogEdit(...)` call.
- Keep: `if (urlTab === 'blog') { ... loadBlog(); }` so the list always loads when the Blog tab is selected.

### 2) Add pagination dropdown (default 5)
- File: `views/admin.html`
- Markup: Add a dropdown/select near the “Posts” heading and `#blogNewPostBtn` (same row):
  - `id="blogListLimit"`
  - options: `5` (default) and `All`
- JS: Update `loadBlog()` so it:
  1. fetches all posts once
  2. stores them (e.g. `window._blogPostsCache = posts`)
  3. renders either `posts.slice(0, 5)` or the full list depending on the selected limit.
- Also: call the render function after any action that changes posts (save/publish/delete) so the list remains up to date.

### 3) New Post button hint (Proofread reminder)
- File: `views/admin.html`
- Change the `#blogNewPostBtn` text to include a small hint that proofreading is part of the flow.
  - Example: `New Post (Proofread)`.
- Keep: the existing proofreading reminder inside the New Post form popup.

### 4) Table behavior
- Ensure the `colspan` values remain consistent with the current blog table column count (it is currently 6 columns: Image, Title, Author, Status, Date, Actions).
- Keep existing row HTML (thumbnail + Edit/Publish/Delete).

## Acceptance criteria
- When you click `Blog` tab, you immediately see the posts list table; no modal opens automatically.
- Switching away and back to `Blog` still shows the table immediately.
- The list defaults to showing 5 posts and can expand to show all posts using the dropdown.
- `New Post` button still works as before, and the proofread reminder remains accessible.
