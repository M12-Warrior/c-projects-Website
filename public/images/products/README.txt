Product images for the Shop page
================================

Path: public/images/products/
URL path: /images/products/

Place one image per product in this folder. The site looks for files by product slug.
Use either .jpg or .png (e.g. course-90day.jpg or course-90day.png).
To change an image, replace the file keeping the same name.

Digital products (top section):
  course-90day.jpg     — 90-Day Onboarding Course
  seasoned-packet.jpg  — Seasoned Driver Packet
  fleet-new-hire-packet.jpg
  fleet-refresher-packet.jpg
  fleet-bundle.jpg
  complete-bundle.jpg

Merchandise/gear (from database): two options —
  1) Drop a file here: filename = product slug + .jpg or .png
     e.g. mile-12-warrior-t-shirt.jpg, reflective-safety-vest.png
  2) Admin → Shop → Products → "Edit image" on a row: enter a full URL
     (e.g. https://... or /images/products/your-slug.jpg).
  When creating a new product in Admin you can also set "Image (URL)".

Recommended size: at least 400×280 px. Images are cropped to fit the card (object-fit: cover).
