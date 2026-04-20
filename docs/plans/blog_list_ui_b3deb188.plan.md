---
name: Blog list UI
overview: Update the Admin Blog tab to show all blog posts with title + date, a thumbnail image, and row actions to edit and/or publish.
todos:
  - id: blog-admin-table-thumb
    content: Modify `views/admin.html` Blog table header + `loadBlog()` row HTML to add thumbnail column and include title/date in the list view.
    status: completed
  - id: blog-admin-publish-action
    content: Add a `.blog-publish` button per row in `views/admin.html`, and wire click to open `openBlogEdit(id)` and focus `#blogEditPublishBtn`.
    status: completed
  - id: blog-thumb-css
    content: Add `.blog-thumb` styling in `public/css/pages.css` for consistent thumbnail sizing/borders.
    status: completed
  - id: colspan-fix
    content: Update `colspan` values in `views/admin.html` (No posts / error rows) to match the new column count.
    status: completed
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
     - Add `Publish` (opens the edit modal as well; then we focus the modal’s `blogEditPublishBtn` so you can post with fewer clicks).
   - Update any `colspan` values for “No posts” / error rows to match the new column count.
3. Wire the new Publish button handler in `views/admin.html`:
   - Add a `.blog-publish` click listener that calls `openBlogEdit(id)` and then focuses `blogEditPublishBtn`.
4. Add CSS in `public/css/pages.css`:
   - Create a `.blog-thumb` class for size/cropping/border so thumbnails don’t blow up the table layout.

## Result
After deploy:
- The Admin Blog tab shows all posts with: thumbnail, title, author/status, and date.
- Each row includes `Edit` and `Publish` actions.
- Clicking `Edit` opens the existing edit modal.
- Clicking `Publish` opens the same modal and guides you to click the modal’s Publish button.
