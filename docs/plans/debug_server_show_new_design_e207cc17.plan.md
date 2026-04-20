---
name: Debug server show new design
overview: The new design code is correct in all files, but the server crashed on startup ("Port 3000 is already in use") so the browser is showing an OLD cached version from a stale process. Kill the old process, restart the server, and hard-refresh the browser.
todos:
  - id: kill-port
    content: Kill the old server process occupying port 3000
    status: completed
  - id: restart-server
    content: Restart the server with node server.js from c:\Projects\Website
    status: completed
  - id: hard-refresh
    content: Hard-refresh browser (Ctrl+Shift+R) at http://localhost:3000 to see new design
    status: completed
isProject: false
---

# Debug and See the New Design

## Root cause

The terminal output at `terminals/1.txt` shows:

```
Mile 12 Warrior running on port 3000
Port 3000 is already in use
```

The new server started, detected port 3000 was taken by an **old** server process (still serving the old asphalt-themed files from before the edits), and immediately exited. The browser at [http://localhost:3000](http://localhost:3000) is hitting that **stale old process**, not the updated code.

## All code changes are already present

No code fixes are needed. The files are correct:

- [public/css/main.css](public/css/main.css) -- concrete palette (`--bg: #2c2c2e`), road-stripe scroll bar, hero road line, phase-tab click animation, chrome button hover
- [public/index.html](public/index.html) -- hero road line div, "Roll on" scroll hint, CB section tags ("Copy That", "Land Line", "Manifest", "Convoy"), CB wave icons, "Ch. 19", cache-busted CSS link (`?v=concrete`)
- [public/js/main.js](public/js/main.js) -- phase-tab channel-switch feedback

## Fix steps (3 commands)

Run these in a terminal from `c:\Projects\Website`:

### Step 1: Kill the old server hogging port 3000

```powershell
npx kill-port 3000
```

Or manually:

```powershell
netstat -ano | findstr :3000
taskkill /PID <the_PID_number> /F
```

### Step 2: Restart the server

```powershell
node server.js
```

You should see `Mile 12 Warrior running on port 3000` **without** the "Port 3000 is already in use" error.

### Step 3: Hard-refresh the browser

Open [http://localhost:3000](http://localhost:3000) and press **Ctrl + Shift + R** (hard refresh) to bypass cache. Or use an Incognito window.

## What you should see after the fix

- **Concrete gray** background (lighter, cooler than the old near-black asphalt)
- **Gold road-stripe** scroll progress bar at the top (dashed segments instead of solid)
- **Hero road line** -- a subtle horizontal gold gradient line drifting across the hero section
- **"Roll on"** at the bottom of the hero instead of "Scroll to explore"
- **Section tags** with CB lingo: "Copy That -- The Full Picture", "Land Line -- Resources", "Manifest -- Free Downloads", "Convoy -- The Mile 12 Community"
- **CB wave icons** (three arcs) next to the Roadmap and Community section tags
- **"Ch. 19"** label at the end of the phase-tab bar
- **Phase tab click feedback** -- brief scale-pulse when switching tabs
- **Chrome shine** on primary button hover

