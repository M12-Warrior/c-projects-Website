---
name: Blog list persistent
overview: Keep the Blog posts list visible at all times (no automatic modal opening on tab load) and add a dropdown to show 5 posts by default with an option to show the full list.
todos: []
isProject: false
---

## Goal
On `Admin -> Blog`, the **posts list table** (thumbnail/title/author/status/date/actions) should be visible immediately on tab open, without requiring you to click `Cancel`/close a popup. Also, the list should default to showing **5** newest posts with a dropdown to expand to the full list.

## Root cause to fix
In `views/admin.html`, the admin init code auto-opens the blog edit modal when `?tab=blog&edit=...` is present:
- `var urlTab = urlParams.get('tab');`
- `var urlEditId = urlParams.get('edit');`
- `if (urlEditId) setTimeout(function() { openBlogEdit(urlEditId); }, 400);`

This auto-opening