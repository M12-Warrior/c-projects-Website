---
name: Blog posts list load fix
overview: Fix the Admin Blog tab so the list of all posts (the table with Title, Author, Status, Date, Actions) loads reliably every time you open or return to the Blog tab, not only after creating a new post.
todos: []
isProject: false
---

# Blog posts list load fix

## What you’re seeing (layout)

On the **Admin → Blog** tab there are **two tables**:

1. **Pending blog comments** — headers: **Post, Author, Comment, Date, Actions**. This lists comments awaiting approval, not your posts.
2. **Posts** — under the “Posts” heading and “New Post” button, headers: **Image, Title, Author, Status, Date, Actions**. This is the list of all your blog posts (drafts and published). This is the one that goes empty when you leave and come back.

## Likely cause

When you switch to the Blog tab, the code **does** call `loadBlog()` (see [views/admin.html](c:\Projects\Website\views\admin.html) tab click handler around lines 428–441). So the list should load. The fact that it only appears after you create a new post suggests one or both of:

- **Caching** — The browser may be reusing an old response for `GET /api/blog/admin/posts`, so you sometimes see a stale (e.g. empty) list.
- **No way to retry** — If the first load fails or returns empty, there’s no “Refresh” control, so the list stays empty until the next successful load (e.g. after “New Post” saves and calls `loadBlog()` again).

## Proposed changes (all in [views/admin.html](c:\Projects\Website\views\admin.html))

1. **Force a fresh load when opening the Blog tab**  
   In `loadBlog()`, call `fetch('/api/blog/admin/posts', { credentials: 'include', cache: 'no-store' })` so the list is not served from cache when you switch to the tab.

2. **Guard against missing element**  
   At the start of `loadBlog()`, if `document.getElementById('blogTable')` is null, return early so the rest of the function doesn’t throw and leave the table in an inconsistent state.

3. **Add a “Refresh” button next to “New Post”**  
   In the Blog section, add a button (e.g. “Refresh list”) that calls `loadBlog()`. So if the list is empty or outdated when you open the tab, you can reload it without creating a new post.

4. **Optional: small copy tweak**  
   Under the “Posts” heading, the existing line already says: “Use the table below to edit or delete existing posts. Use New Post to create one.” Optionally add: “If the list is empty, click **Refresh list** to load it.” so the behavior is clear.

## Result

- Opening or returning to the Blog tab will request a fresh posts list from the server (no cache).
- If the list is still empty or wrong, “Refresh list” gives a one-click way to reload.
- The first table stays “Pending blog comments”; the second table stays “all your posts” and should now show reliably when you’re on the Blog tab.
