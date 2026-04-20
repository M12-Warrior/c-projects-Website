---
name: Blog list UI
overview: Update the Admin Blog tab to show all blog posts with title + date, a thumbnail image, and row actions to edit and/or publish.
todos: []
isProject: false
---

## Goal
Make the Admin Blog tab show a real, complete list of all posts (title/date + thumbnail) and ensure each row lets you edit and/or post.

## What to change
- Update the blog posts table markup in `views/admin.html` (the Blog tab).
- Update the row rendering logic inside `loadBlog()` in `views/admin.html` to include the thumbnail column and a Publish action.
- Add a small CSS style for the thumbnail in `public/css/pages.css`.

## Implementation outline
1. Update Blog table header in `views/admin.html` under `#tabBlog`:
   - Add an `Image` column (so the table includes Thumbnail + Title + Date).
   - Ensure header column count matches the generated rows.
2. Update `loadBlog()` in `views/admin.html`:
   - In the `posts.map(...)` HTML row string, add a thumbnail `<img>` cell using `p.image`.
   - Add a second action button in the Actions cell:
     - Keep `Edit` (already opens `openBlogEdit(id)`).
     - Add `Publish` (opens the edit modal as well; then