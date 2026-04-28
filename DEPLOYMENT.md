# Deployment Guide — Verpex Shared Hosting

> **Target host:** Verpex shared hosting (cPanel + CloudLinux)
> **Target domain:** `jonathantorres.dev`
> **Plan:** Standard shared hosting with Node.js support enabled

This guide walks through deploying the Flight Tracker app to Verpex. The whole app runs on one host — both the React frontend and the Express backend live in the same cPanel account.

---

## How the deployment works

1. **Express backend** runs as a Node.js app via cPanel's "Setup Node.js App" tool. It listens on a high port that cPanel assigns. Phusion Passenger (the underlying tech) wires it up to your domain so requests hit Node correctly.
2. **React frontend** is built locally with `npm run build`, producing a `dist/` folder of static files. The Express server is configured to serve those static files itself (look for the `NODE_ENV === 'production'` block in `server/index.js`).
3. **One URL** — `https://jonathantorres.dev` serves both the React app and the `/api/*` endpoints.

If you'd rather put the project on a subdomain like `flights.jonathantorres.dev`, see the "Subdomain setup" section at the bottom.

---

## Step 1 — Build the frontend locally

On your own machine, in the project folder:

```bash
npm install
npm run build
```

This creates a `dist/` folder. That folder, plus the `server/`, `package.json`, and `package-lock.json`, are what need to end up on Verpex. You do **not** need to upload `node_modules/` — the server installs its own.

---

## Step 2 — Upload the project to Verpex

You have three ways to do this. Pick whichever you're comfortable with.

### Option A — File Manager (simplest, no extra software)

1. Log into cPanel → click **File Manager**.
2. Navigate to your home directory `/home/emskukyps0e2/`.
3. Create a folder called `flight-tracker` outside `public_html` (e.g. directly in your home directory). **Do not put the Node.js app inside `public_html`** — that folder is for static files served directly by Apache, and we want Passenger to serve the app instead.
4. Upload these items into `flight-tracker/`:
   - `dist/` (your built frontend)
   - `server/` (the Express code)
   - `src/utils/validators.js` (the server imports this — keep the path structure intact, so make sure `src/utils/` exists with the file inside)
   - `package.json`
   - `package-lock.json`
   - `.env` (which you'll create — see step 4)

   You can zip the project locally first, upload the zip, then use the File Manager's Extract button. That's much faster than uploading file-by-file.

### Option B — Git (cleanest)

If you push the project to GitHub:

1. cPanel → **Git Version Control** → Create.
2. Repository URL: your GitHub repo URL.
3. Repository Path: `/home/emskukyps0e2/flight-tracker`.
4. Click Create. cPanel clones the repo into that folder.
5. Future updates: push to GitHub, then click "Update from Remote" in the Git panel.

### Option C — FTP (FileZilla / WinSCP)

cPanel → **FTP Accounts** → use your existing FTP credentials. Drag your local project folder into `/home/emskukyps0e2/flight-tracker/`.

---

## Step 3 — Set up the Node.js app

1. cPanel → **Setup Node.js App** (under Software).
2. Click **Create Application**.
3. Fill in:
   - **Node.js version:** pick the highest 18.x or 20.x available.
   - **Application mode:** Production.
   - **Application root:** `flight-tracker` (relative to your home directory).
   - **Application URL:** `jonathantorres.dev` (or leave blank for a subdomain — see bottom).
   - **Application startup file:** `server/index.js`
   - **Passenger log file:** leave default.
4. Click **Create**.

cPanel now generates a virtual environment and prints something like:
```
source /home/emskukyps0e2/nodevenv/flight-tracker/20/bin/activate && cd /home/emskukyps0e2/flight-tracker
```
**Copy that command — you'll need it.**

5. Still on the Node.js App page, find your app and click **Run NPM Install**. This installs all dependencies from `package.json`. Wait for it to finish (a minute or two).

---

## Step 4 — Set environment variables

Two ways:

### In cPanel (recommended for secrets)

In the same Node.js App config screen, scroll to **Environment Variables**. Add:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | leave unset — Passenger picks the port |
| `FLIGHTRADAR24_API_KEY` | your real key |
| `WEATHER_API_KEY` | your real key (or leave blank if using Open-Meteo) |

Click **Save**, then **Restart** the app.

### Or via a `.env` file

Some hosts ignore `.env` when running under Passenger. Try the cPanel UI first; only fall back to `.env` if those values aren't being read.

---

## Step 5 — Restart and test

In the Node.js App panel, click **Restart**.

Open `https://jonathantorres.dev` in your browser. You should see the Flight Tracker landing page. Test the API:

```
https://jonathantorres.dev/api/health
```

Should return JSON like `{"ok": true, "ts": 1730000000000}`.

If you get a 503 or "Application Error," check the Passenger log file path shown in the Node.js App panel. The Terminal tool in cPanel lets you `tail` it:

```bash
tail -50 /home/emskukyps0e2/flight-tracker/passenger.log
```

---

## Step 6 — HTTPS (free)

Verpex bundles AutoSSL via Let's Encrypt:

1. cPanel → **SSL/TLS Status** (under Security).
2. Find `jonathantorres.dev` → click **Run AutoSSL**.
3. Within a few minutes the cert installs automatically. After that, the site is available at `https://jonathantorres.dev`.

You may also want to force HTTPS:
- cPanel → **Domains** → toggle **Force HTTPS Redirect** for `jonathantorres.dev`.

---

## Pushing updates after the first deploy

The clean loop:

```bash
# locally
npm run build
git add . && git commit -m "..." && git push
```

Then in cPanel:
- If you used **Option B (Git)**: Git Version Control → Update from Remote → then Restart the Node.js app.
- If you used **Option A (File Manager)** or **Option C (FTP)**: re-upload the changed files (especially `dist/`) → Restart the Node.js app.

The **Restart** step is mandatory — Passenger caches the running app and won't pick up code changes otherwise. There's also a `restart.txt` trick: `touch /home/emskukyps0e2/flight-tracker/tmp/restart.txt` from the Terminal does the same thing.

---

## Subdomain setup (optional)

If you'd rather host the app at `flights.jonathantorres.dev` and keep `jonathantorres.dev` for something else:

1. cPanel → **Domains** → Create A New Domain.
2. Domain: `flights.jonathantorres.dev`. Document Root: leave default.
3. Then in **Setup Node.js App**, set the Application URL to `flights.jonathantorres.dev`.
4. Run AutoSSL on the new subdomain.

---

## Common problems and fixes

**"Application Error" on first load**
Check the Passenger log via Terminal. 90% of the time it's either: missing dependency (re-run NPM Install), a typo in the startup file path, or the `.env` / environment variables not being loaded.

**Site shows the cPanel default page instead of the app**
The Application URL in the Node.js App config doesn't match the domain. Fix it and restart.

**API works but the React app shows a blank page**
You forgot to upload `dist/`, or you uploaded it to the wrong folder. The Express server expects `dist/` to live at `flight-tracker/dist/` (one level up from `server/`).

**Frontend loads but `/api/*` calls 404**
The Application URL might be set to a path like `jonathantorres.dev/flight-tracker` instead of just the domain. Easiest fix: deploy at the root of the domain or use a subdomain.

**Need to debug live**
cPanel → **Terminal** → run the activation command Verpex gave you in Step 3. Now you have a shell inside the Node environment. You can run `node server/index.js` directly to see startup errors that the Passenger log might be hiding.

---

## What to demo for class

Once deployed, your demo URL is `https://jonathantorres.dev`. That's a real public HTTPS site your professor and teammates can hit from anywhere.

Helpful things to point out during the demo:
- Real domain, real HTTPS cert
- Frontend and backend deployed together
- Live API integration with FlightRadar24 / weather
- Share links work across devices (test by pasting one on your phone)
