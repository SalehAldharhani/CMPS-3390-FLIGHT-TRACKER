# Deployment Guide

This project has two pieces that need to live somewhere:

1. **Frontend** — static React build (HTML/CSS/JS). Goes on **Bluehost**.
2. **Backend** — Express server. Goes on **Render** (free tier).

Bluehost shared hosting can serve static sites fine but is unreliable for running Node.js. Render's free Node tier is purpose-built for this and costs nothing.

> **Heads up about Render's free tier:** the server "sleeps" after 15 minutes of no traffic. The next request takes ~30 seconds to wake it up. For a class demo, hit any page on the site about a minute before you present and it'll be warm.

---

## Part 1 — Deploy the backend to Render

### 1.1 Push the project to GitHub

If you haven't already:

```bash
cd flight-tracker
git init
git add .
git commit -m "Initial skeleton"
git branch -M main
git remote add origin https://github.com/<your-username>/flight-tracker.git
git push -u origin main
```

### 1.2 Create the Render service

1. Sign up at https://render.com (free, GitHub login works).
2. Dashboard → **New +** → **Web Service**.
3. Connect your GitHub account, pick the `flight-tracker` repo.
4. Fill in the form:
   - **Name:** `flight-tracker-api` (or whatever — this becomes part of your URL)
   - **Region:** pick the one closest to you
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Instance Type:** **Free**

5. Click **Advanced** and add environment variables (the same ones from `.env.example`):
   - `NODE_ENV` = `production`
   - `FLIGHTRADAR24_API_KEY` = (your real key, when you have one)
   - `WEATHER_API_KEY` = (your real key, when you have one)
   - `PORT` = `3001` *(Render sets this automatically, but it doesn't hurt to be explicit)*

6. Click **Create Web Service**. Render will build and deploy. First deploy takes 2–5 min.

### 1.3 Note your backend URL

When it's done, Render gives you a URL like:
```
https://flight-tracker-api.onrender.com
```

Test it: open `https://flight-tracker-api.onrender.com/api/health` in a browser. You should see `{"ok":true,"ts":...}`. If you do, the backend is live. 🎉

---

## Part 2 — Build the frontend pointing at the backend

The frontend currently calls `/api/*` and assumes the backend is on the same origin (because of the Vite dev proxy). For production, we need to point it at Render's URL.

### 2.1 Add a production API base URL

Create a new file `.env.production` in the project root:

```
VITE_API_BASE=https://flight-tracker-api.onrender.com
```

(Replace with your actual Render URL.)

### 2.2 Update `apiClient.js` to use it

Open `src/apiClient.js` and change this line near the top:

```js
const BASE = '/api';
```

to:

```js
const BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api';
```

In dev, `VITE_API_BASE` is empty, so it falls back to `/api` and the Vite proxy works. In production, it becomes the full Render URL.

### 2.3 Allow the frontend's origin in the backend's CORS

Open `server/index.js` and replace `app.use(cors());` with something like:

```js
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://yourdomain.com',
    'https://www.yourdomain.com',
  ],
}));
```

Replace `yourdomain.com` with your real domain. Commit and push — Render auto-redeploys.

### 2.4 Build the frontend

```bash
npm run build
```

This produces a `dist/` folder. That's what you upload to Bluehost.

---

## Part 3 — Upload the frontend to Bluehost

### Option A — File Manager (easiest, slowest)

1. Log into Bluehost → **My Sites** → **Manage Site** → **Advanced** tab → **File Manager**.
2. Open `public_html/` (or a subfolder if you want it at `yourdomain.com/flight-tracker/` instead of the root).
3. Delete the default `index.html` if there is one.
4. Click **Upload**, drag in the **contents of `dist/`** (not the folder itself — the files inside it).
5. Wait for upload to finish.

### Option B — FTP (faster for repeat deploys)

1. In cPanel, find **FTP Accounts**. Use your existing FTP credentials.
2. Connect with FileZilla or similar.
3. Upload contents of `dist/` to `public_html/` (or your chosen subfolder).

### 3.1 Add the SPA rewrite rule

React Router uses client-side routing — if a user goes directly to `yourdomain.com/flight/AA100`, Apache will look for a file at that path and 404. We fix it with an `.htaccess` file.

Create `.htaccess` inside the same folder as `index.html` (you can do this in File Manager: **+ File** → name it `.htaccess`):

```apache
# Send everything that's not a real file to index.html so React Router can handle it.
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Cache static assets aggressively
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Don't cache index.html so users get the latest deploy
<FilesMatch "index\.html$">
  <IfModule mod_headers.c>
    Header set Cache-Control "no-cache, must-revalidate"
  </IfModule>
</FilesMatch>
```

> If you put the app in a subfolder (e.g. `public_html/flight-tracker/`), change `RewriteBase /` to `RewriteBase /flight-tracker/` and `RewriteRule . /index.html` to `RewriteRule . /flight-tracker/index.html`.

### 3.2 Test

Open `https://yourdomain.com` (or `https://yourdomain.com/flight-tracker` if you put it in a subfolder). You should see the app. Search for `AA100` — if it loads flight data, the frontend↔backend connection is working.

---

## Part 4 — Subdomain option (optional but nicer)

If you'd rather have the backend live at `api.yourdomain.com` instead of an `onrender.com` URL:

1. In Render → your service → **Settings** → **Custom Domains** → add `api.yourdomain.com`.
2. Render gives you a CNAME target (something like `flight-tracker-api.onrender.com`).
3. In Bluehost → **Domains** → **Subdomains** → create `api` subdomain pointed at any folder (the folder doesn't matter, we override with DNS next).
4. In Bluehost → **DNS Management** for your domain → add a CNAME record:
   - Name: `api`
   - Target: `flight-tracker-api.onrender.com.` (note the trailing dot)
5. Wait for DNS to propagate (10 min – 24 hr).
6. Update `.env.production` to use `https://api.yourdomain.com` instead.
7. Rebuild and redeploy the frontend.

---

## Repeat deploys

Once it's all set up, the iteration loop is:

| Change to | Steps |
|---|---|
| Backend code | `git push` → Render auto-deploys (about 2 min) |
| Frontend code | `npm run build` → upload contents of `dist/` to Bluehost via FTP |

Tip: write a tiny `deploy.sh` that builds and uploads in one command.

---

## Troubleshooting

**Site loads but says "couldn't load this flight"**
The frontend can't reach the backend. Open the browser DevTools → Network tab. Look at the failing request:
- `404` or `Cannot GET` → URL is wrong; check `VITE_API_BASE` in `.env.production` and rebuild
- `CORS error` → add your domain to the `cors()` origin list in `server/index.js`
- Long delay then works → Render free tier was asleep, this is normal

**Render service won't start**
Check the build logs in the Render dashboard. Common culprits:
- Missing env var (e.g. server tries to read something from `.env` that isn't set in Render)
- `package.json` syntax error
- Port mismatch — Render injects `PORT`; your code already reads it via `process.env.PORT`, so leave that alone

**`.htaccess` does nothing on Bluehost**
File Manager hides files starting with a dot by default. In File Manager, click **Settings** (top right) → check **Show Hidden Files** to confirm it's actually there.

**Refreshing a deep link (e.g. `/flight/AA100`) returns a Bluehost 404 page**
The `.htaccess` rewrite isn't working. Verify:
1. The file is named exactly `.htaccess` (with the leading dot)
2. It's in the same folder as `index.html`
3. Bluehost has `mod_rewrite` enabled (it does by default)

---

## What this satisfies in the spec

Deploying like this knocks out a couple of items in the project requirements:

- **Version control** ✓ (you're using git + GitHub)
- **3rd-party APIs/integrations** ✓ (FlightRadar24, weather) — once Clonexstax wires up the real APIs

You don't need a public deployment to satisfy the spec — the demo can run locally — but it's a nice-to-have for sharing the project URL with classmates and your professor.
