# Adding Images to the Site

Yes — you add images **here** (in this project and through the Admin dashboard). The site uses **concrete gray**, **safety gold**, and **silver/chrome** so your logo and header image match the trucking/safety look.

---

## 1. Logo (site-wide)

- **Where:** **`public/images/logo.png`** (or `.svg`).
- **How:** Drop your existing Mile 12 Warrior logo file into that folder. The navbar on every page will show it. If the file is missing, a fallback icon + “Mile 12 Warrior” text is shown.
- Use the same logo as on your current live site for a streamlined brand.

---

## 2. Header / hero image (homepage)

- **Where:** Put a single image file that will be used as the **hero background** on the homepage.
- Your **official M12 professional banner** is at **`public/images/hero-bg.png`**. The homepage hero uses it as the background (with a dark overlay so text stays readable). To replace it, overwrite that file.

---

## 3. Images throughout the site (decorative or section images)

- **Option A — In the repo:** Put image files in **`public/images/`** (e.g. `public/images/about-hero.jpg`, `public/images/services-intro.png`). Then we (or you, if you edit HTML) reference them as `/images/about-hero.jpg` in the pages.
- **Option B — Via Admin upload:** Use **Admin → Blog** (or a future “Media” area) and use **Upload image**. The file is saved under **`public/uploads/`** and you get a URL like `/uploads/filename.jpg`. You can use that URL anywhere we support “image URL” (e.g. blog featured image, or later product image / section image fields).

So: “images throughout the site” = add files to **`public/images/`** and/or upload in Admin and use the returned URLs where the app allows.

---

## 3. Blog images

- **Featured image (one per post):**
  - In **Admin → Blog**, when creating or editing a post, use **Featured image (URL)**.
  - Either paste a URL (e.g. from another site) or click **Upload image**, choose a file, and the URL will be filled in for you. That image appears at the top of the post and on the blog listing.
- **Images inside the post:**
  - In **Admin → Blog**, the **Content** field is HTML. You can paste an image tag, e.g.  
    `<img src="/uploads/your-photo.jpg" alt="Description">`  
  - If you uploaded the image via **Upload image**, use the URL you got (e.g. `/uploads/your-photo.jpg`) in that `src`. So yes — you add blog images here (upload or paste URL) and in the content HTML.

---

## 5. Product images (shop)

- Products have an **image** field (URL). Right now the admin product form may not expose it; we can add an “Image URL” (and an “Upload image” button) there the same way as for the blog. Once added, you’d add product images the same way: paste URL or upload and paste the returned URL.

---

## 6. Where files live

| Purpose              | Folder / URL              | How you add it |
|----------------------|---------------------------|----------------|
| **Logo**             | `public/images/logo.png` → `/images/logo.png` | Drop file in `public/images/` |
| Hero/header          | `public/images/hero-bg.jpg` → `/images/hero-bg.jpg` | Drop file in `public/images/` (same as current site header) |
| Other static images  | `public/images/...`       | Drop files in `public/images/`; reference as `/images/...` |
| Uploaded (blog, etc.)| `public/uploads/` → `/uploads/...` | Admin → Blog → “Upload image” (or future Media) |

---

## Summary

- **Logo:** Add **`public/images/logo.png`** (your existing Mile 12 Warrior logo) so the nav shows it on every page.
- **Header:** Add **`public/images/hero-bg.jpg`** (same as your current live site header) so the homepage hero matches your brand.
- **Blog:** Use **Admin → Blog** → **Featured image** (URL or **Upload image**), and optionally put `<img src="...">` in the post **Content**.
- **Elsewhere:** Put files in **`public/images/`** or upload via Admin and use the given URLs where the app supports them.

The site colors (asphalt black, safety gold, silver/chrome) are set so your logo and header image flow with the rest of the design. No separate “media library” is required.
