# Social media links

Social “Follow us” links are set to open in a new tab and use these profile URLs:

| Platform  | Current URL |
|-----------|-------------|
| Facebook  | https://www.facebook.com/mile12warrior |
| X (Twitter) | https://x.com/mile12warrior |
| Instagram | https://www.instagram.com/mile12warrior |
| TikTok    | https://www.tiktok.com/@mile12warrior |

## Where they appear

- **Contact** (`/contact`): “Follow Us” icon links + footer text links  
- **About** (`/about`): contact block + footer  
- **Home** (`/`): footer  
- **Course** (`/course`): footer  

## Updating the URLs

When you have your real profile URLs, search the project for:

- `facebook.com/mile12warrior`
- `x.com/mile12warrior`
- `instagram.com/mile12warrior`
- `tiktok.com/@mile12warrior`

Replace with your actual profile URLs in:

- `views/contact.html` (two blocks: Follow Us + footer)
- `views/about.html` (two blocks: contact-social + footer)
- `views/course.html` (footer)
- `public/index.html` (footer)

All links use `target="_blank"` and `rel="noopener noreferrer"` so they open in a new tab.
