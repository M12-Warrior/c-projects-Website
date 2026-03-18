# Blog and Images — Step-by-Step Guide

This guide covers (1) **creating and editing blog posts** on the Mile 12 Warrior site and (2) **editing images** on blogs and elsewhere on the site. Treat it as a first-time walkthrough.

---

## Part 1: Writing and Managing Blog Posts

### What you need

- An **admin account**. Only admins can create or edit posts. If you don’t have one, create a user and set their role to `admin` in the database (or use an existing admin).
- A browser where you’re **logged in** as that admin.

---

### Step 1: Open the Admin page

1. In your browser, go to your site (e.g. `https://yoursite.com` or `http://localhost:3000`).
2. **Log in** with your admin account (Sign In in the nav).
3. Go to the **Admin** page. The link is usually in the nav when you’re logged in as admin (e.g. `/admin`).
4. You should see tabs such as Dashboard, Users, Blog, etc.

---

### Step 2: Create a new blog post

1. Click the **Blog** tab.
2. Click the **“New Post”** button.
3. A form will appear. Fill it in:

   - **Title** (required)  
     The post title. The site will turn it into a URL-friendly “slug” (e.g. “My First Trip” → `my-first-trip`).

   - **Excerpt** (optional)  
     Short summary shown on the blog listing page. A sentence or two is enough.

   - **Featured image**  
     - **Option A — Upload:**  
       Click **“Upload image”**, choose a file from your computer (JPEG, PNG, GIF, or WebP; max 5 MB). After upload, the **Featured image (URL)** field will be filled with something like `/uploads/yourfile-1234567890.jpg`. Leave that as is.
     - **Option B — Use a URL:**  
       If the image is already online or in your project, paste the full URL (e.g. `https://...`) or a path like `/images/photo.jpg` into the **Featured image (URL)** field.

   - **Content** (required)  
     The main body. You can type plain text; you can also use **HTML** (e.g. `<p>...</p>`, `<strong>...</strong>`, `<a href="...">...</a>`, `<img src="..." alt="">`). So you can paste or write simple HTML for headings, links, and images inside the post.

   - **Published**  
     Check this if you want the post visible on the public blog immediately. Leave unchecked to save as a **draft** (only visible in Admin).

4. Click **“Create Post”**.  
   The new post will appear in the list. If it’s published, it will show on the public **Blog** page and at a URL like `/blog/my-first-trip`.

---

### Step 3: Edit an existing blog post (including its image)

1. Stay on the Admin page, **Blog** tab.
2. In the table of posts, find the post you want to change.
3. Click **“Edit”** for that post.
4. A modal opens with the same fields: Title, Excerpt, Featured image (URL), Content, Published.
5. **To change the featured image:**
   - **Replace with an upload:** Click **“Upload image”**, choose a new file. The **Featured image (URL)** field will update to the new `/uploads/...` path.
   - **Replace with a URL:** Clear the field and paste a new image URL or path (e.g. `https://...` or `/uploads/other.jpg`).
6. Change any other fields (title, excerpt, content, published) as needed.
7. Click **“Save changes”**.  
   The post (and its featured image) will update on the site.

---

### Step 4: Images inside the post body

- The **Content** field accepts HTML. To add images **inside** the post (not just the featured image), use an HTML image tag, for example:
  - From an upload:  
    `<img src="/uploads/yourfile-1234567890.jpg" alt="Description">`
  - From elsewhere:  
    `<img src="https://example.com/photo.jpg" alt="Description">`
- To get a `/uploads/...` URL: use **“Upload image”** in the New Post or Edit form; copy the URL that appears in the Featured image field and paste it into your Content HTML, or upload once and use that same URL in multiple posts.

---

### Summary: Blog flow

| Goal              | Where to go              | Action                                                                 |
|-------------------|---------------------------|------------------------------------------------------------------------|
| Create a post     | Admin → Blog → New Post  | Fill form (title, excerpt, image, content), check Published, Create.  |
| Edit a post       | Admin → Blog → Edit      | Change fields (including featured image), Save changes.                |
| Change post image | Admin → Blog → Edit      | Upload a new image or paste a new URL in Featured image (URL).         |
| Draft vs live     | Admin → Blog             | Uncheck “Published” for draft; check it to make the post public.      |

---

## Part 2: Editing Images Elsewhere on the Site

Besides blog posts, images appear in a few fixed places. Here’s where they live and how to change them.

---

### 1. Blog post featured images and images inside post content

- **Where:** Stored as a URL in the database (per post). Shown on the blog listing and at the top of each post (and anywhere you put `<img>` in the Content).
- **How to edit:** Use Admin → Blog → Edit post → change **Featured image (URL)** (upload or paste URL). For images inside the body, edit the post’s **Content** HTML and change the `src` in the `<img>` tags (you can use new uploads or new URLs).

---

### 2. Uploaded images (e.g. for blogs)

- **Where on server:** Files are saved in the project folder:  
  `public/uploads/`  
  Filenames look like: `myphoto-1709123456789.jpg`.
- **URL on site:** `https://yoursite.com/uploads/myphoto-1709123456789.jpg` (or `/uploads/...` in HTML).
- **How to “edit”:**  
  - **Replace in a blog:** In Admin → Blog → Edit post, use “Upload image” to add a new file; the new URL is saved for that post. Old files stay in `public/uploads/` unless you delete them manually.  
  - **Use your own file:** Put your image in `public/uploads/` (e.g. copy/paste or drag in), then in Admin use the URL `/uploads/yourfilename.jpg` in the Featured image field or in the post Content.

---

### 3. Logo (navbar on every page)

- **Where:** One file used site-wide:  
  `public/images/logo.svg`
- **How to edit:** Replace the file `public/images/logo.svg` with your new logo (keep the same filename so no code changes are needed). Use an SVG for best quality; if you use a PNG/JPG, you’d need to update the HTML/CSS that references `logo.svg` to the new filename.

---

### 4. Hero background (homepage)

- **Where:** Referenced in `public/css/main.css` as:  
  `url('/images/hero-bg.png')`
- **How to edit:**  
  - Add or replace the file: `public/images/hero-bg.png` (PNG recommended).  
  - If you use a different name (e.g. `hero-bg.jpg`), open `public/css/main.css`, find `.hero-bg-image` and change the `url(...)` to `/images/hero-bg.jpg` (or your filename).

---

### 5. Product images (shop)

- **Where:** Folder: `public/images/products/`  
  The shop expects images named by product slug, e.g. `course-90day.jpg`, `mile-12-warrior-t-shirt.png`.  
  There is a `public/images/products/README.txt` with the exact names.
- **How to edit:** Replace or add image files in `public/images/products/` with the correct filename (slug + `.jpg` or `.png`). No admin UI for this; it’s file-based. Product pages and the shop use these paths.

---

### Quick reference: Image locations

| What                 | Location / how to edit                                      |
|----------------------|-------------------------------------------------------------|
| Blog featured image  | Admin → Blog → Edit post → Featured image (upload or URL)   |
| Images in post body  | Edit post Content HTML; use `/uploads/...` or full URLs     |
| Uploaded files       | Stored in `public/uploads/`; use URL `/uploads/filename`     |
| Nav logo             | Replace `public/images/logo.svg`                            |
| Homepage hero bg     | Replace `public/images/hero-bg.png` (or edit main.css)      |
| Shop products        | Add/replace files in `public/images/products/` (see README) |

---

## Tips

- **Image size:** For blog featured images and hero, 1200–1600 px wide is usually enough. Upload limit in Admin is 5 MB per file.
- **Drafts:** Create a post with “Published” unchecked, then Edit and check “Published” when you’re ready to show it.
- **Slug:** The post URL is generated from the title. If you change the title, the slug can change (depending on implementation); old bookmarks might break. Prefer editing title only when necessary.
- **Backups:** Before replacing `logo.svg` or `hero-bg.png`, copy the existing file somewhere safe so you can revert if needed.

If you want, the next step can be a short “cheat sheet” (one page) with only the steps for “Create a post” and “Change a blog image” for quick reference.
