# /public — PWA assets

Files in this folder are served at the root of the site (e.g. `manifest.json` is fetched as `/manifest.json`).

## What's here

- **`manifest.json`** — the PWA manifest. Tells browsers how the app appears when installed (name, colors, icons, display mode).
- **`sw.js`** — the service worker. Caches the app shell so the site loads instantly on repeat visits and works offline.
- **`favicon.svg`** — placeholder airplane favicon. Replace with a real design when JASD3EP has one.

## Still needed (TODO: DESIGN)

The manifest references three icon files that don't exist yet:

| File | Size | Notes |
|---|---|---|
| `pwa-192.png` | 192×192 px | Standard app icon |
| `pwa-512.png` | 512×512 px | High-res app icon |
| `pwa-512-maskable.png` | 512×512 px | Maskable variant — keep important content within the inner 80% safe zone (Android crops the corners) |

Until these exist, the install prompt will work but icons will look broken. Drop them in this folder when ready.

**Quick generator if you don't want to design from scratch:**
- https://maskable.app/editor — drag in any image, it spits out maskable PNGs
- https://realfavicongenerator.net — comprehensive favicon + PWA icon generator

## Testing the PWA

The service worker only registers on **production builds**, not in dev (so Vite's hot-reload doesn't fight with it). To test:

```bash
npm run build
npm run server      # serves the built dist/ folder
```

Then in Chrome:
1. Open `http://localhost:3001` (the production server)
2. Open DevTools → Application tab → Manifest — verify the manifest is detected
3. Application tab → Service Workers — verify `sw.js` is "activated and running"
4. Look for the install icon in the address bar (looks like a monitor with a down arrow)
5. Click it to install the app to your desktop / home screen

## Cache busting after a deploy

If you change the app and want users to get fresh code, bump `CACHE_VERSION` at the top of `sw.js`. Old caches get cleaned up on next activation.
