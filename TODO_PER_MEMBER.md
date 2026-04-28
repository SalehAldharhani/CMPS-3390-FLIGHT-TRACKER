# What's Left To Do — Per Member

> **Read your section. Ignore the others (unless you're curious).** This is a working document. Cross things off as you go.

---

## 📊 Project status at a glance

The skeleton is built and works on mock data. To go from "skeleton" to "demo-ready," each person has a small list. The whole team is roughly **80% done** overall.

**Required spec items:** 5/5 in the code, 1 needs GitHub push to officially count
**Additional features (the 5 we picked):** 4/5 in the code, 1 still TODO (API testing)
**Preparation phase docs:** 5/5 done

---

## 👤 Jon (Front End)

### 🔴 Priority — do first

#### 1. Push the project to GitHub
**Why:** This is the one thing only you can do, and it satisfies the **Version Control** requirement on the spec. Until this happens, the team can't really collaborate.

**Files:** none (just terminal commands)

**Steps:**
```
cd "C:\Users\jonat\Documents\- College Work\CMPS 3390\CMPS3390-FINAL-PROJECT\flight-tracker"
git init
git add .
git commit -m "Initial skeleton commit"
git branch -M main
git remote add origin https://github.com/<your-username>/flight-tracker.git
git push -u origin main
```

Then add Clonexstax and JASD3EP as collaborators in GitHub → Settings → Collaborators.

**Time:** 15-20 minutes

---

### 🟡 Priority — do when the API is wired up

#### 2. Test the frontend against real data
**Why:** When Clonexstax replaces the mock data with real FlightRadar24/weather calls, your code might break in subtle ways. Real APIs return weird edge cases (missing fields, nulls, different time zones).

**Files to check:**
- `src/components/FlightCard.jsx` — does it render when fields are missing?
- `src/components/FlightDetailPage.jsx` — same question for the info tiles
- `src/components/WeatherPanel.jsx` — does it handle when one airport's weather call fails but the other succeeds?
- `src/models/Flight.js` — do the computed properties (`progressPercent`, `routeLabel`) handle missing data gracefully?

**What to add as you find issues:** defensive `?.` operators and `??` fallbacks.
Example: `flight.position?.altitude ?? '—'` instead of `flight.position.altitude`.

**Time:** 1-3 hours, after Clonexstax finishes API integration

---

### 🟢 Optional / stretch

#### 3. Build the actual map (BIG TASK)
**Why:** `FlightMap.jsx` is currently a placeholder. The brief originally mentioned rnmapbox — for the web equivalent we'd use **MapLibre GL JS**.

**Files:**
- `src/components/FlightMap.jsx` — replace the placeholder with a real map

**Steps:**
1. `npm install maplibre-gl`
2. Import the library + its CSS in `FlightMap.jsx`
3. Initialize the map in a `useEffect` when the component mounts
4. Add markers at `flight.origin` and `flight.destination`
5. Draw a great-circle line between them
6. If `flight.position` exists, add a plane marker at the live position with `flight.position.heading` for rotation

**Time:** 4-8 hours

**Decision point:** Skip this if you're tight on time. The placeholder works fine for a class demo, and the spec doesn't require a map.

#### 4. Improve the empty state on Home
**Why:** When a new user opens the site, the home page just says "No flights tracked yet." Could be more inviting.

**Files:**
- `src/components/HomePage.jsx` — the `ft-home__empty` block at the bottom
- Optionally `src/components/FlightContext.jsx` — pre-populate with `['AA100', 'BA2490']` for new visitors

**Time:** 15-30 minutes

---

## 👤 Clonexstax (Back End)

### 🔴 Priority — do first

#### 1. Pick the APIs your team will use
**Why:** Your work depends on this decision. Don't replace mock data without picking providers first.

**Files to read:** `docs/research-log.md` — has the full comparison

**Decisions to make:**

**Flight API:** *(recommended: combine OpenSky + AviationStack)*
- **OpenSky Network** — free, no API key, only live position data
- **AviationStack** — 100 free requests/month, schedule + airline metadata
- **FlightRadar24** — premium, paid

**Weather API:** *(strongly recommended: Open-Meteo)*
- **Open-Meteo** — free, no key, simplest possible
- **OpenWeatherMap** — popular, 60 req/min free tier
- **WeatherAPI.com** — generous free tier

**Time:** 30 minutes of research + sign-up

---

#### 2. Add API keys to `.env`
**Why:** API keys never go in the code or in Git. They live in `.env`.

**Files:**
- `.env.example` — read this for the template
- `.env` — create this (it's gitignored so don't worry about committing it)

**Steps:**
```
cp .env.example .env
```

Then edit `.env` and fill in real values for `FLIGHTRADAR24_API_KEY` and `WEATHER_API_KEY`.

**Time:** 10 minutes

---

#### 3. Replace mock flight data with real API calls
**Why:** This is the **3rd-party APIs/integrations** spec item. Currently returns hardcoded data for AA100 and BA2490.

**Files:**
- `server/services/flightService.js` — replace the mock blocks marked `TODO: BACKEND`

**The contract you must follow:** the JSON shape your function returns **must match** what `src/models/Flight.js` expects. The expected shape is documented at the top of `flightService.js`:

```js
{
  flightNumber: "AA100",
  airline: "American Airlines",
  status: "EN_ROUTE" | "SCHEDULED" | "LANDED" | "CANCELLED" | "DELAYED",
  origin:      { iata, city, lat, lon },
  destination: { iata, city, lat, lon },
  departure:   { scheduled: ISO, actual: ISO|null, gate: string|null },
  arrival:     { scheduled: ISO, estimated: ISO|null, gate: string|null },
  position:    { lat, lon, altitude, heading, groundSpeed } | null,
  aircraft:    { model: string, registration: string }
}
```

**The two functions to implement:**
- `fetchFlightFromProvider(flightNumber)` → returns one flight object or null
- `searchFlightsFromProvider(query)` → returns array of matching flights

**How to test:**
- Run `npm start`
- Search for a real flight number in the UI
- Or use Postman: `GET http://localhost:3001/api/flights/AA100`

**Time:** 3-5 hours

---

#### 4. Replace mock weather data with real API calls
**Why:** Same idea, simpler than flights.

**Files:**
- `server/services/weatherService.js` — replace the mock block

**The contract you must follow:**
```js
{
  location: string,
  tempC: number,
  tempF: number,
  condition: string,
  icon: string,
  windKph: number,
  windDirection: string, // "N", "NE", etc.
  visibilityKm: number,
  precipitationMm: number,
  updatedAt: ISO string
}
```

**The function to implement:**
- `fetchWeatherFromProvider({ lat, lon })` → returns weather object

**Time:** 1-2 hours (Open-Meteo is the fastest path)

---

### 🟢 Optional / stretch

#### 5. Upgrade share-link storage to SQLite
**Why:** Currently share links live in an in-memory `Map`, so server restarts wipe them. SQLite makes them survive restarts. Strengthens the **Persistent Data Storage** spec item ("we have it on both client AND server").

**Files:**
- `server/controllers/shareController.js` — replace the `shares` Map with SQLite calls

**Library to use:** `better-sqlite3` (zero-config, single file)

```bash
npm install better-sqlite3
```

**Time:** 2-3 hours

---

## 👤 JASD3EP (Design)

### 🔴 Priority — do first

#### 1. Read the style guide
**Files:**
- `docs/style-guide.md` — explains the token system, type scale, color philosophy, what NOT to do

**Time:** 15 minutes of reading

---

#### 2. Decide on the visual direction
**Why:** The skeleton ships with a placeholder dark navy + amber palette. Your team can keep that or pivot. Discuss with Jon.

**Some directions to consider:**
- **Aviation night-sky** *(current placeholder)* — deep navy, amber accent, mono fonts for flight numbers
- **Clean minimalist** — white background, single signal red, lots of whitespace
- **Retro 70s airline** — mustard, brown, cream, condensed serif
- **Brutalist mono** — everything in monospace, hard borders, no shadows

**Files:** none yet (just team alignment)

**Time:** 30 minutes of discussion

---

#### 3. Replace placeholder fonts with real ones
**Files:**
- `src/styles/app.css` — find the `--font-display`, `--font-body`, `--font-mono` variables in section 1
- `index.html` — add a `<link>` to Google Fonts in the `<head>`

**Recommended fonts (free, no signup needed):**
- **Display:** Space Grotesk, Geist, Manrope, or Fraunces
- **Body:** Same as display, or Inter Tight
- **Mono:** JetBrains Mono, IBM Plex Mono, or Geist Mono

**How to add a Google Font:**

In `index.html`, add this in the `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

Then in `app.css`, change:
```css
--font-display: ui-sans-serif, system-ui, ...;
```
to:
```css
--font-display: "Space Grotesk", system-ui, sans-serif;
--font-mono:    "JetBrains Mono", ui-monospace, monospace;
```

**Time:** 30 minutes

---

#### 4. Refine the color palette
**Files:**
- `src/styles/app.css` — section 1 (Design Tokens)

**What to change:** all the `--color-*` variables. Run the app while editing — every change cascades through the whole app.

**Don't touch:** anything in section 2-6 (those use the variables you're changing). The cascade does the work.

**Time:** 1-2 hours

---

#### 5. Polish each component visually
**Files:**
- `src/styles/app.css` — sections 3 (Layout), 4 (Pages), 5 (Components)

**The brief:** Walk through each page in the running app. Note anything that feels generic, off-balance, or "AI-default." Tweak the corresponding CSS section. Common things that make a big difference:
- Better hover states on buttons
- Tighter or looser spacing on cards
- Smoother transitions on hover
- Stronger visual hierarchy on the hero text

**Time:** 4-10 hours depending on how polished you want it. Could go on indefinitely.

---

### 🟢 Optional / stretch

#### 6. Design real PWA icons
**Why:** The current icons are placeholders generated programmatically — an amber airplane on a navy circle. Functional but not designed.

**Files to create/replace:**
- `public/pwa-192.png` (192×192)
- `public/pwa-512.png` (512×512)
- `public/pwa-512-maskable.png` (512×512, content within inner 80%)
- `public/favicon.svg` (the browser tab icon)

**Tools that help:**
- https://maskable.app/editor — drag in any image, it spits out maskable PNGs
- https://realfavicongenerator.net — full icon set generator

**Time:** 30 min – 2 hours

#### 7. Honor `prefers-reduced-motion`
**Files:**
- `src/styles/app.css` — add a new section at the bottom

Add this block:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

This respects users who've requested reduced motion in their OS settings. Small accessibility win.

**Time:** 10 minutes

---

## 👥 Anyone (whoever has bandwidth)

### 🔴 Required — must be done before demo

#### 1. Build the API testing collection
**Why:** This is one of the team's 5 chosen additional features. Currently not done. Without it, you only have 4/5 of your additional features — and the spec requires 4 minimum, so you have zero buffer.

**Steps:**
1. Download Postman (free) — https://www.postman.com/downloads/ — or Insomnia
2. With your local server running (`npm start`), create a collection called "Flight Tracker"
3. Add one request for each endpoint:
   - `GET http://localhost:3001/api/health`
   - `GET http://localhost:3001/api/flights/AA100`
   - `GET http://localhost:3001/api/flights/search?q=american`
   - `GET http://localhost:3001/api/weather?lat=40.6413&lon=-73.7781`
   - `POST http://localhost:3001/api/share` with body `{"flightNumber": "AA100"}`
   - `GET http://localhost:3001/api/share/<shareId-from-previous-call>`
4. Test each one — they should all return 2xx status codes
5. Export the collection: in Postman, right-click the collection → Export → Collection v2.1 → Save as `api-collection.json`
6. Move the file into `docs/api-collection.json` and commit

**Time:** 30-60 minutes

**Best fit for:** Whoever's least busy when this comes up. Honestly easier for the backend dev since they're already testing endpoints, but anyone can do it.

---

## 📅 Suggested order of operations

If the team is starting fresh, here's a sensible sequence:

**Day 1 (right now):**
- Jon: Push to GitHub
- Everyone else: Clone the repo, run `npm install`, run `npm start`, confirm it works locally
- Clonexstax: Pick the APIs

**Days 2-4:**
- Clonexstax: Wire up real flight + weather APIs (the big work)
- JASD3EP: Read style guide, pick fonts, refine palette
- Jon: Wait or start the map

**Days 5-6:**
- Jon: Test against real APIs, fix any breakage
- JASD3EP: Polish components
- Anyone: Build the Postman collection

**Day 7 (demo prep):**
- Pre-track sample flights so the home page looks lived-in
- Rehearse the demo flow once
- Have a backup plan (recording, screenshots) if something breaks

---

## 🚨 Things to NOT do (decided already)

So no one accidentally re-debates these:

- **No login / accounts / signup** — share-link feature covers the same use case. Adding auth is 10-20 hours.
- **No live deployment** — demo will be local. Less can go wrong.
- **No claiming Architecture Pattern or Design Pattern** as spec features — the code uses them, but the team picked 5 other features to claim.
- **No Web Workers, no SSR, no Docker** — not in our chosen 5.
- **No real-time push notifications** — would need server-side infra.

---

## ❓ When stuck

- **Can't get something running locally?** Check `README.md` first.
- **Don't know what a file does?** Look it up in `PROJECT_GUIDE.md` — every file is documented.
- **API question?** `docs/research-log.md` and `docs/architecture.md`.
- **Design question?** `docs/style-guide.md`.
- **Not sure if a feature counts toward the spec?** Check the README's spec coverage section.

If still stuck, drop it in the team Discord. Faster than guessing.
