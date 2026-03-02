# Mile 12 Warrior — Mobile App

Native Android & iOS mobile application built with Capacitor, wrapping the Mile 12 Warrior web platform into a true phone app.

## Architecture

```
mobile-app/
├── www/                    # Web app source (the SPA)
│   ├── index.html          # Single-page app entry point
│   ├── css/app.css         # Mobile-optimized dark theme
│   ├── js/api.js           # API client + cart + utilities
│   ├── js/pages.js         # All 19 page renderers
│   └── js/app.js           # SPA router + navigation
├── android/                # Native Android project (Android Studio)
├── ios/                    # Native iOS project (Xcode)
├── capacitor.config.json   # Capacitor configuration
└── package.json            # Dependencies & scripts
```

## Features

- **Home** — Hero, stats, quick links, latest blog posts
- **About** — Joyce's story, Mile 12 Warrior mission, brands
- **Services** — Wellness & Fatigue, Fleet Consulting, Community
- **Safety Roadmap** — 7-phase roadmap with detailed content
- **Blog** — Read posts, view comments, add comments (logged in)
- **Forum** — Browse categories, threads, replies, create threads
- **Shop** — Product catalog, add to cart, checkout
- **Profile** — Account info, bio editing, order history
- **Contact** — Send messages directly from the app

## Prerequisites

### For Android
- [Android Studio](https://developer.android.com/studio) (latest)
- Android SDK 33+ (API Level 33)
- Java 17+

### For iOS (macOS only)
- [Xcode 15+](https://developer.apple.com/xcode/)
- CocoaPods (`sudo gem install cocoapods`)
- macOS Ventura or later

### Backend Server
The mobile app connects to the Mile 12 Warrior backend API. The backend must be running for the app to function.

```bash
# From the root Website directory
node server.js
```

## Setup & Build

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

### 2. Configure API URL

By default, the app connects to `http://localhost:3000`. For production or testing on a real device, update the API URL:

**Option A — In the app:** Open the app, go to Profile, and the API URL can be set in localStorage under `m12w_api_url`.

**Option B — Edit api.js:** Change the fallback URL in `www/js/api.js`:
```js
const API_BASE = localStorage.getItem('m12w_api_url') || 'https://your-server.com';
```

**For local network testing on a phone:** Use your computer's LAN IP (e.g., `http://192.168.1.100:3000`).

### 3. Build for Android

```bash
# Sync web assets to Android project
npm run cap:sync

# Open in Android Studio
npm run cap:build:android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Select your device/emulator
3. Click **Run** (green play button)
4. For release APK: **Build > Generate Signed Bundle / APK**

### 4. Build for iOS (macOS only)

```bash
# Sync web assets to iOS project
npm run cap:sync

# Open in Xcode
npm run cap:build:ios
```

In Xcode:
1. Select your team under **Signing & Capabilities**
2. Select your device/simulator
3. Click **Run** (play button)
4. For App Store: **Product > Archive**

## Development Workflow

After making changes to files in `www/`:

```bash
# Sync changes to native projects
npx cap sync

# Or just copy without updating plugins
npx cap copy
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run cap:sync` | Sync web assets to all platforms |
| `npm run cap:build:android` | Sync + open Android Studio |
| `npm run cap:build:ios` | Sync + open Xcode |
| `npm run cap:open:android` | Open Android Studio |
| `npm run cap:open:ios` | Open Xcode |
| `npm run setup:android` | First-time Android setup |
| `npm run setup:ios` | First-time iOS setup |
| `npm run setup:all` | First-time setup for both platforms |

## Publishing

### Google Play Store
1. In Android Studio: **Build > Generate Signed Bundle / APK**
2. Choose **Android App Bundle (.aab)** for Play Store
3. Create or use a keystore for signing
4. Upload the `.aab` to [Google Play Console](https://play.google.com/console)

### Apple App Store
1. In Xcode: **Product > Archive**
2. Open **Window > Organizer**
3. Click **Distribute App**
4. Follow the App Store Connect submission flow
5. Manage the listing at [App Store Connect](https://appstoreconnect.apple.com)

## Troubleshooting

**App shows blank screen:** Make sure the backend server is running and the API URL is correct.

**CORS errors:** The backend server includes CORS headers for Capacitor origins. If you're using a custom domain, add it to the CORS `origin` array in `server.js`.

**Android: "net::ERR_CLEARTEXT_NOT_PERMITTED":** The `capacitor.config.json` already sets `cleartext: true`. If it persists, check `android/app/src/main/AndroidManifest.xml` has `android:usesCleartextTraffic="true"`.

**iOS: "App Transport Security":** For development, the iOS project allows cleartext. For production, use HTTPS for your API server.
