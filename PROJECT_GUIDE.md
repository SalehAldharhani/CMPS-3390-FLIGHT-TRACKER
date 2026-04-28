# Project Guide — How Flight Tracker Works

> **Read this if you're new to the codebase.** It explains every folder, every file, why it exists, and what's left to build. You should never have to ask "what does this do?" — the answer is in here.

---

## Quick orientation — the 60-second version

Flight Tracker is a **React JS website** with an **Express backend** that work together. Users type a flight number, the backend pulls live data from a flight API (and a separate weather API), and the React frontend shows it. Users can track multiple flights, share read-only links, and install the whole thing as a desktop/mobile app via the PWA spec.

There are exactly **3 things running** when the app is live:

1. **The Vite dev server** (port 5173) — only in development. Serves the React app with hot-reload.
2. **The Express backend** (port 3001) — always running. Handles `/api/*` routes, talks to flight + weather APIs, holds API keys.
3. **The browser** — runs the React code, makes requests to `/api/*`, manages local state.

In production (e.g. on a real server), Vite is gone. Express alone serves both the built React app *and* the API on a single port.

---

## How a request flows through the app

This is the most important thing to understand. Once you get this, every file makes sense.

**Example: User searches for "AA100"**

```
1. User types AA100 in the search box (FlightSearch.jsx)
   └─> validateFlightNumber() runs in validators.js
        └─> If invalid: red error appears, request never sent
        └─> If valid: navigate to /flight/AA100

2. URL changes to /flight/AA100
   └─> React Router matches the route in App.jsx
        └─> Renders FlightDetailPage.jsx

3. FlightDetailPage calls the useFlight() hook
   └─> useFlight calls fetchFlight("AA100") from apiClient.js
        └─> apiClient sends GET /api/flights/AA100 to the Express server

4. Express receives the request
   └─> server/index.js routes /api/flights/* to server/routes/flights.js
        └─> routes/flights.js maps the URL to flightController.getFlight()
             └─> Controller validates the input AGAIN (server-side validation)
             └─> Controller calls flightService.fetchFlightFromProvider("AA100")
                  └─> Service hits FlightRadar24 (currently returns mock data)
             └─> Controller returns JSON to the client

5. apiClient receives the JSON
   └─> Wraps it in a Flight model class instance (Flight.fromApi)
   └─> Returns the model to useFlight

6. useFlight updates React state
   └─> FlightDetailPage re-renders with the data
   └─> User sees the flight info, weather panel, map
```

Every file in the project plays one part in this flow. The rest of this guide just walks through them.

---

## Folder map

```
flight-tracker/
├── docs/              ← All the prep-phase documents (architecture, user stories, etc.)
├── public/            ← Static files served at the root URL (manifest, icons, service worker)
├── server/            ← The Express backend
│   ├── routes/        ← URL → controller mapping
│   ├── controllers/   ← Request handling logic
│   ├── services/      ← Talks to 3rd-party APIs
│   └── middleware/    ← Cross-cutting concerns (errors, rate limiting)
├── src/               ← The React frontend
│   ├── components/    ← All React components and pages
│   ├── models/        ← Flight + Weather data classes
│   └── styles/        ← One CSS file with everything
├── DEPLOYMENT.md      ← How to deploy to Verpex
├── README.md          ← Quick-start setup
├── PROJECT_GUIDE.md   ← This file
├── package.json       ← Dependencies + scripts
├── vite.config.js     ← Build tool config
├── index.html         ← HTML entry point
├── .env.example       ← Template for environment variables
└── .gitignore         ← Files Git should never track
```

---

## File-by-file walkthrough

### Root files

#### `package.json`

The manifest for the whole project. Key sections:

- **`scripts`** — these are the commands you can run with `npm run <name>`:
  - `dev` — starts Vite (frontend dev server) on port 5173
  - `build` — compiles the React app into a `dist/` folder for production
  - `preview` — serves the built `dist/` (Vite's preview, mostly unused)
  - `server` — runs the Express server (production mode if `NODE_ENV=production`)
  - `server:dev` — runs the Express server with auto-restart on file changes
  - `start` — runs both `server:dev` and `dev` together (this is what you use day-to-day)

- **`dependencies`** — packages used at runtime (React, Express, etc.)
- **`devDependencies`** — packages only used during development (Vite, the React plugin, concurrently)

#### `vite.config.js`

Configures the Vite build tool. Two important things it does:

1. Loads the React plugin so JSX gets compiled to plain JS
2. Sets up a dev-server proxy: any request to `/api/*` from `localhost:5173` gets forwarded to `localhost:3001`. This is what lets the frontend hit the backend without CORS errors during development.

#### `index.html`

The single HTML page that loads everything. Standard Vite setup, plus:

- Links to `/manifest.json` (PWA manifest)
- Apple-specific meta tags so iOS treats it as a real installed app
- A small inline script at the bottom that registers the service worker (only in production — service workers fight with hot-reload in dev, so we skip them on `localhost`)

#### `.env.example`

A template showing what environment variables the app expects. **You copy this to `.env` and fill in real values.** `.env` is gitignored so secrets never end up on GitHub.

The current variables:
- `PORT` — what port Express listens on (default 3001)
- `NODE_ENV` — `development` or `production`
- `FLIGHTRADAR24_API_KEY` — for live flight data (TODO: get a key)
- `WEATHER_API_KEY` — for live weather (TODO: get a key)

#### `.gitignore`

Tells Git what to ignore. Currently: `node_modules`, `dist`, `.env`, log files. Don't remove anything from here without thinking carefully.

---

### `/public` — static files served directly

Everything in this folder is served at the site root. So `public/manifest.json` is fetched as `/manifest.json`.

#### `public/manifest.json`

The PWA manifest. This is what tells the browser:
- The app's name is "Flight Tracker"
- The icons to use on the home screen
- The theme color (`#0b1020` — your dark navy background)
- That when installed, the app opens in standalone mode (no browser chrome)

When this file is valid AND the icons load AND a service worker is registered, Chrome shows the "install" button in the address bar.

#### `public/sw.js` — service worker

This is what makes the site work offline and load instantly on repeat visits. It runs in the background and intercepts every network request.

Two strategies:
- **For `/api/*` requests** → Network first. Try to get fresh data. If offline, fall back to whatever was last cached.
- **For everything else (HTML/CSS/JS/images)** → Cache first. Use the cached version. Only hit the network if it's not cached.

To bust the cache after a deploy, bump `CACHE_VERSION` at the top of the file. Old caches get cleaned up automatically on the next visit.

The service worker only registers on production builds (see `index.html`). In dev mode it's disabled to avoid weird caching bugs while developing.

#### `public/pwa-192.png`, `pwa-512.png`, `pwa-512-maskable.png`

The three icon files referenced by the manifest. Currently placeholder designs (amber airplane on dark navy circle). JASD3EP can replace these whenever a real icon design is ready.

The maskable variant is for Android — Android crops icons into different shapes (circle, squircle, etc.), so the maskable icon keeps its content within the inner 80% safe zone.

#### `public/favicon.svg`

The little icon that shows in browser tabs. SVG, dark navy background, amber airplane glyph.

#### `public/README.md`

Documentation for the public folder itself — explains what each asset is and how to test the PWA install flow.

---

### `/server` — the Express backend

This is structured in **MVC style** (Model-View-Controller, sort of). The "models" live on the client side (in `/src/models/`) since the server is just an API. So really it's Routes → Controllers → Services.

#### `server/index.js` — the server entry point

The file that starts everything. When you run `npm run server`, this is what runs.

What it does, in order:
1. Loads environment variables from `.env`
2. Creates the Express app
3. Adds middleware (CORS, JSON body parser, rate limiter)
4. Mounts the routes:
   - `/api/flights` → flight routes
   - `/api/weather` → weather routes
   - `/api/share` → share-link routes
   - `/api/health` → simple health check
5. **In production only:** also serves the React build from `dist/` so the same server handles both API and frontend
6. Adds the central error handler
7. Starts listening on the port

#### `server/routes/flights.js`, `weather.js`, `share.js`

Tiny files. Their only job is to map URL patterns to controller functions. Example from `flights.js`:

```js
router.get('/search', searchFlights);          // GET /api/flights/search
router.get('/:flightNumber', getFlight);       // GET /api/flights/AA100
```

That's literally the whole file. Routes don't contain logic — they just say "this URL goes to this function."

#### `server/controllers/flightController.js`

The **pure server-side controller** required by the spec. Handles `/api/flights/*` requests.

Two functions:
- **`getFlight(req, res)`** — extracts the flight number from the URL, validates it (using the same `validators.js` the frontend uses), calls the service to get data, returns JSON. Returns 400 if the flight number is malformed, 404 if not found, 500 on server errors.
- **`searchFlights(req, res)`** — same idea but for `/api/flights/search?q=...`.

The pattern: validate input, call service, format response, handle errors. Controllers never talk to external APIs directly — that's what services are for.

#### `server/controllers/weatherController.js`

Same pattern. Validates that `lat` and `lon` query params are numbers in the valid range (-90/90 for lat, -180/180 for lon), then calls the weather service.

#### `server/controllers/shareController.js`

Implements the share-link feature.

- **`createShare(req, res)`** — accepts a flight number in the request body, validates it, sanity-checks the flight actually exists by calling the service, generates a random 16-character `shareId` using Node's crypto module, stores `shareId → flightNumber` in an in-memory `Map`, and returns the `shareId` and a relative URL.
- **`getShare(req, res)`** — looks up a `shareId`, checks if it expired (7 days), fetches the current flight data, returns it.

**Limitation:** the share map lives in memory, so server restarts wipe all share links. Upgrading to SQLite is a stretch goal mentioned below.

#### `server/services/flightService.js`

Where real flight data fetching lives. Currently returns hardcoded mock data for `AA100` and `BA2490`. **The actual integration with FlightRadar24 (or AviationStack, or OpenSky) goes here** — clearly marked with `TODO: BACKEND` comments.

The two functions:
- `fetchFlightFromProvider(flightNumber)` — returns one flight object or `null`
- `searchFlightsFromProvider(query)` — returns an array of matching flights

The output shape is documented at the top of the file and **must match** what `src/models/Flight.js` expects.

#### `server/services/weatherService.js`

Same idea, for weather. Currently returns deterministic mock data based on lat/lon. The real integration (Open-Meteo recommended — no API key needed) goes in here.

#### `server/middleware/errorHandler.js`

Catches any unhandled error from the controllers and returns a clean JSON error response. Without this, errors would leak stack traces to the client.

#### `server/middleware/rateLimiter.js`

Tracks how many requests each IP makes. If an IP exceeds 120 requests per minute, it gets a 429 response. This protects your 3rd-party API quotas from abuse. Uses a simple in-memory `Map` — fine for a class project; production apps would use Redis.

---

### `/src` — the React frontend

#### `src/main.jsx` — React entry point

The very first thing that runs in the browser. It:
1. Imports the global CSS (`styles/app.css`)
2. Wraps the `App` component in three providers:
   - `<React.StrictMode>` — extra checks during development
   - `<BrowserRouter>` — enables client-side routing (URLs like `/flight/AA100` work without page reload)
   - `<FlightProvider>` — gives every component access to the tracked-flights state
3. Mounts the whole tree into `<div id="root">` from `index.html`

#### `src/App.jsx` — top-level routing

Defines what URL maps to what page. There are 4 routes:

| URL | Component | Purpose |
|---|---|---|
| `/` | HomePage | Search box + tracked flights list |
| `/flight/:flightNumber` | FlightDetailPage | Single flight view (map, weather, info) |
| `/share/:shareId` | SharedFlightPage | Public read-only share link |
| `*` | NotFoundPage | 404 |

Also renders `<Header />` above and `<Footer />` below every page.

#### `src/apiClient.js` — the only file that calls `fetch()`

Every backend request flows through this file. It exposes 5 functions:

- `fetchFlight(flightNumber)` → returns a `Flight` model instance
- `searchFlights(query)` → returns `Flight[]`
- `fetchWeather({lat, lon})` → returns a `Weather` model instance
- `createShareLink(flightNumber)` → returns `{ shareId, url }`
- `fetchSharedFlight(shareId)` → returns a `Flight` model instance

All of them go through one shared `request()` helper that handles:
- 10-second timeouts via AbortController
- JSON parsing
- Error normalization (any non-2xx response throws an `ApiError`)

This is also one of the **2+ HTTP API calls** required by the spec. We have 5 — well past the requirement.

#### `src/validators.js` — input validation, used by both frontend AND backend

The same validation rules run on the client (for fast UX feedback) and on the server (for real security). One file, imported in both places.

Functions:
- `sanitizeFlightNumber(input)` — uppercases, trims whitespace
- `validateFlightNumber(input)` — must match `^[A-Z0-9]{2}\d{1,4}$` (e.g. AA100, BA2490)
- `validateEmail(input)` — basic email regex + length check
- `validatePassword(input)` — 8-128 chars
- `validateSafeText(input)` — rejects characters commonly used in SQL injection (`'`, `"`, `;`, `<`, `>`, `\`, `--`, `/*`, `*/`)

This is your **client/server data validation/sanitization** spec item.

#### `src/components/Header.jsx`

The sticky navigation bar at the top. Brand mark on the left, nav links on the right.

#### `src/components/Footer.jsx`

The footer at the bottom. Copyright, team credits.

#### `src/components/HomePage.jsx`

The landing page. Shows:
- Hero section with the title, lede, and search box
- "Tracked flights" section that lists all flights in the user's localStorage (one `<FlightCard>` per flight)
- Empty state when no flights are tracked

#### `src/components/FlightDetailPage.jsx`

The detail view for one flight. Pulls the flight number from the URL via React Router's `useParams`, calls `useFlight()` to fetch data, and renders:
- Header (airline, flight number, route, status badge)
- Action buttons (Track/Untrack, Share link)
- The map placeholder (`<FlightMap>`)
- Info tiles (departure, arrival, aircraft, position)
- Weather panel for both airports

Polls the API every 30 seconds for fresh data.

#### `src/components/SharedFlightPage.jsx`

A simplified read-only view of a flight, used for share links. Pulls the `shareId` from the URL, calls the share API, renders just enough info to be useful (no track/untrack buttons, no editing).

#### `src/components/NotFoundPage.jsx`

404 page. Just a message and a link back home.

#### `src/components/FlightSearch.jsx`

The search box. On submit:
1. Runs `validateFlightNumber()` on the input
2. If invalid, shows an error message
3. If valid, navigates to `/flight/<number>`

#### `src/components/FlightCard.jsx`

A summary card for one tracked flight. Calls `useFlight()` itself with `pollMs: 60000` so each card refreshes independently. Shows flight number, status badge, route, progress bar (when in flight), and a "View details" link.

Has three states:
- Loading: shimmer skeleton
- Error: red border with error message and "Remove" button
- Loaded: the full card

#### `src/components/FlightMap.jsx`

**Placeholder** for the map widget. Currently just shows a styled background with origin/destination IATA codes. The actual map (using MapLibre GL JS, Mapbox, or Leaflet) is a **TODO** — see "What's left" below.

#### `src/components/WeatherPanel.jsx`

Shows weather for both the origin and destination airports. Uses `Promise.all` to fetch both in parallel — this satisfies the **state-handling with async functions** spec item.

Each card has a colored left border based on flight impact (green/amber/red) computed by the `Weather` model class.

#### `src/components/ShareLinkButton.jsx`

The "Share link" button. Workflow when clicked:
1. POSTs to `/api/share` with the current flight number
2. Receives back a `shareId`
3. Builds the full URL: `${window.location.origin}/share/<shareId>`
4. Copies it to the clipboard via `navigator.clipboard.writeText`
5. Shows "✓ Copied to clipboard" for 2 seconds, then resets

#### `src/components/FlightContext.jsx`

Holds the list of **tracked flight numbers** in React state, with persistence to localStorage. Any component can use `useFlights()` to read the list, add a flight, or remove one.

**User-aware:** the storage key is `ft.trackedFlights.v2.<username>`, so each signed-in user gets their own list. Switching users (sign out + sign in as someone else) shows that user's flights instead.

This is your **persistent data storage (locally)** spec item.

#### `src/components/useFlight.js`

A custom React hook that fetches one flight by number. Handles:
- Loading state
- Error state (with `AbortController` so navigating away cancels in-flight requests)
- Optional polling (e.g., refetch every 30 seconds for the detail page, every 60 for cards)
- A `refetch()` function for manual retry

Demonstrates **async/await + AbortController** for clean concurrency.

#### `src/components/AuthContext.jsx`

Manages local-only user accounts via React Context.

**Important:** This is **not** real authentication — usernames and passwords live in `localStorage` and are readable by anyone with access to the device. It's purely a demo/personalization layer. Real auth would need server-side hashed passwords + sessions/JWTs (see "out of scope").

What it stores:
- `ft.users.v1` — `{ username: { password } }` — the local user "database"
- `ft.currentUser.v1` — the currently signed-in username, or null

Exports `useAuth()` which gives any component: `currentUser`, `isSignedIn`, `signUp()`, `signIn()`, `signOut()`.

#### `src/components/RequireAuth.jsx`

A wrapper component used by `App.jsx` to protect routes. If the user isn't signed in, it redirects to `/login` and remembers where they were trying to go (so post-login can return them there).

```jsx
<Route path="/" element={
  <RequireAuth><HomePage /></RequireAuth>
} />
```

#### `src/components/LoginPage.jsx`

The sign-in form. Username + password. Validates client-side using `validateUsername` and `validatePassword` (the same functions the server uses for input validation). On success, navigates back to wherever the user was trying to go.

#### `src/components/SignupPage.jsx`

The signup form. Username + password + confirm password. Same validators, plus a "passwords don't match" check. New accounts are auto-signed-in.

#### `src/models/Flight.js`

A class that wraps raw flight JSON from the API. Exposes computed properties so views don't have to compute them themselves:

- `displayName` — "American Airlines AA100"
- `routeLabel` — "JFK → LHR"
- `statusLabel` / `statusToken` — for both display text and CSS class names
- `delayMinutes`
- `progressPercent` — used by the in-flight progress bar
- `isEnRoute` / `isLanded` / `isCancelled` etc.
- Static method `fromApi(json)` — Factory pattern, used by `apiClient.js`

This is one of your two **client-side data model classes** required by the spec.

#### `src/models/Weather.js`

Same pattern, for weather data. Key computed property is `flightImpact` which returns `'clear'`, `'caution'`, or `'severe'` based on wind speed and visibility — this drives the colored border on the weather cards.

#### `src/styles/app.css`

**The only CSS file in the project.** All design tokens, all component styles, everything. Organized into 6 sections with banner comments so JASD3EP can Ctrl+F to whatever they need:

1. Design tokens (colors, fonts, spacing variables)
2. Global resets and base elements
3. Layout (app shell, header, footer)
4. Pages (home, flight detail)
5. Components (search, cards, map, weather, share)
6. Utilities

Change a value in section 1 and it cascades through the whole app.

---

### `/docs` — preparation phase documents

These satisfy the prep-phase requirement (need 4 of 5 — we have all 5).

- **`user-stories.md`** — Target audience, three personas (Maya, Carlos, Sam), 11 user stories, scope cuts.
- **`features.md`** — Functional + non-functional requirements, acceptance criteria.
- **`architecture.md`** — System diagram, layer-by-layer explanation, design patterns table, persistence strategy, deployment plan.
- **`style-guide.md`** — Color tokens, typography scale, spacing, motion, component patterns, accessibility checklist, "what NOT to do" list.
- **`research-log.md`** — The original research log entries (ChatGPT, rnmapbox, FlightRadar24, weather), plus open decisions on which APIs to actually pick.

---

## Spec coverage — what we have

### Required main features

| Requirement | Where |
|---|---|
| Version control | Git + GitHub |
| Pure server-side controller | `server/controllers/flightController.js` |
| 2+ HTTP API calls from client | 5 of them in `src/apiClient.js` |
| Client-side data model classes | `src/models/Flight.js`, `Weather.js` |
| Well-designed UI/UX | Token system in `src/styles/app.css` (JASD3EP polishes) |

### Additional features (need 4) — we have all 5

| Requirement | Where |
|---|---|
| Persistent data storage | `localStorage` for **per-user** account data (`AuthContext`) and tracked flights (`FlightContext`, scoped per user) |
| Client/Server validation/sanitization | `src/validators.js` used on both sides |
| 3rd-party APIs/integrations | FlightRadar24 + weather (mock now, real once Clonexstax wires them up) |
| API testing | TODO — Postman/Insomnia collection in `docs/api-collection.json` |
| State-handling with async functions | `useFlight.js` (async/await + AbortController), `WeatherPanel.jsx` (Promise.all) |

### Preparation phase (need 4 of 5) — we have all 5

| Requirement | Where |
|---|---|
| User Profiles/Stories | `docs/user-stories.md` |
| Features/Requirements | `docs/features.md` |
| App Architecture | `docs/architecture.md` |
| Style Guide / UI Design | `docs/style-guide.md` |
| Research log | `docs/research-log.md` |

---

## What's left — the TODO list

Ordered by priority and difficulty.

### 🔴 Required to ship (MUST do)

#### 1. Replace mock flight data with a real API
**Owner: Clonexstax**
**File: `server/services/flightService.js`**

Currently `fetchFlightFromProvider()` and `searchFlightsFromProvider()` return hardcoded mock data for AA100 and BA2490. Replace the mock blocks (clearly marked `TODO: BACKEND`) with real `fetch()` calls.

Recommended providers (see `docs/research-log.md`):
- **OpenSky Network** — free, no API key, but only live position data (no schedule/gate info)
- **AviationStack** — 100 free requests/month, has schedule data
- **FlightRadar24** — paid, premium quality

Best approach: combine OpenSky (live position) with AviationStack (schedule + airline metadata).

The function output **must match** the JSON shape documented at the top of `flightService.js` and in `src/models/Flight.js`. If the provider's response is different, transform it before returning.

Estimated time: 3-5 hours.

#### 2. Replace mock weather data with a real API
**Owner: Clonexstax**
**File: `server/services/weatherService.js`**

Same pattern as flights. **Strongly recommend Open-Meteo** — completely free, no API key required, simplest possible setup.

Estimated time: 1-2 hours.

#### 3. Add API keys to `.env`
**Owner: Clonexstax**

After signing up for the chosen APIs:
1. `cp .env.example .env`
2. Fill in the real keys
3. **Never commit `.env`** (it's in `.gitignore`, just don't force it)

Estimated time: 15 minutes.

#### 4. Push to GitHub
**Owner: Jon**

The version control requirement isn't met until it's actually on GitHub.

Estimated time: 15 minutes (covered in earlier setup messages).

#### 5. Build the API testing collection
**Owner: Anyone**
**File: create `docs/api-collection.json`**

Use Postman or Insomnia to create a collection that hits every `/api/*` endpoint with example requests and responses. Export the collection as JSON and commit it. Hits the **API testing** spec item.

Estimated time: 1 hour.

### 🟡 Important polish (SHOULD do)

#### 6. Build the actual map
**Owner: Jon**
**File: `src/components/FlightMap.jsx`**

Currently a placeholder. Pick a library (recommend **MapLibre GL JS** — free, no token, beautiful) and render:
- Origin and destination markers
- A great-circle line between them
- The live aircraft position when airborne

```bash
npm install maplibre-gl
```

Notes inline in the file. The flight position data is at `flight.position` (lat/lon/altitude/heading/groundSpeed).

Estimated time: 4-8 hours.

#### 7. Pick the visual direction and refine
**Owner: JASD3EP**
**File: `src/styles/app.css`**

The skeleton ships with a placeholder dark navy + amber palette and system fonts. JASD3EP should:
- Decide whether to keep that direction or pivot
- Replace placeholder fonts with real ones (suggestions in `docs/style-guide.md`)
- Polish each component's section in `app.css`
- Run through every page and tighten visuals

All values are CSS variables at the top of `app.css` — change once, cascades everywhere.

Estimated time: 4-10 hours depending on how polished you want it.

#### 8. Real PWA icons
**Owner: JASD3EP**
**Files: `public/pwa-192.png`, `pwa-512.png`, `pwa-512-maskable.png`**

Currently placeholder amber-airplane-on-navy circles. Replace with real designs.

Quick generators if designing from scratch is overkill:
- https://maskable.app/editor — for the maskable variant
- https://realfavicongenerator.net — full icon set generator

Estimated time: 30 min - 2 hours.

### 🟢 Optional / stretch (NICE to have)

#### 9. Upgrade share-link storage to SQLite
**Owner: Clonexstax**
**File: `server/controllers/shareController.js`**

Currently the share map lives in an in-memory `Map`, so server restarts wipe all share links. Swap for SQLite using `better-sqlite3` (zero-config, single file). This makes the **persistent data storage** spec item stronger ("we have BOTH localStorage on the client AND SQLite on the server" sounds better than "we just use localStorage").

Estimated time: 2-3 hours.

#### 10. Improve the empty state on Home
**Owner: Jon or JASD3EP**

Currently the home page shows "No flights tracked yet. Search above to add one." when empty. Could:
- Pre-track 2-3 sample flights for new visitors so the page never looks empty
- Or: more inviting copy with example flight numbers

Estimated time: 15-30 minutes.

#### 11. Honor `prefers-reduced-motion`
**Owner: JASD3EP**

Add a `@media (prefers-reduced-motion: reduce)` block in `app.css` that disables animations for users who've requested reduced motion. Ticks an accessibility item.

Estimated time: 30 minutes.

### ⚪ Out of scope (DECIDED not to do)

These came up but the team chose not to build them. Listed here so we don't accidentally re-debate them.

- **Real authentication (server-side users, hashed passwords, sessions/JWTs)** — we have **local-only accounts** stored in localStorage (Tier 2 auth). It feels like a multi-user app for the demo without needing a database, password hashing, or session middleware. Real auth would be 10-20 hours; the spec doesn't require any of it.
- **Architecture pattern as a spec item** — the codebase *uses* an MVC-ish layout (routes → controllers → services), but it's not on our chosen 5. We get the organizational benefit without claiming the credit.
- **Design pattern as a spec item** — same as above. `Flight.fromApi` / `Weather.fromApi` use the factory method pattern; `apiClient.js` uses the module pattern. They make the code cleaner but aren't claimed.
- **Concurrency/multithreading via Web Worker** — not in our chosen 5.
- **Server-side rendering** — not in our chosen 5.
- **Virtual machines / Docker containers** — not in our chosen 5.
- **Push notifications when flight status changes** — would need real-time infra and SW background sync, not worth it.

---

## Common questions

### "Why are there two `useFlight` calls on the detail page that look like they do the same thing?"

Each `<FlightCard>` on the home page calls `useFlight()` independently to fetch its own data. The `<FlightDetailPage>` also calls `useFlight()` for its own data. They're separate fetches because the home page uses cards (60s polling) and the detail page is more aggressive (30s polling). Each hook has its own AbortController, its own state, etc.

### "Why is the validators file shared between client and server?"

Single source of truth. If we wrote separate validators, they'd drift out of sync — the client would say "AA100 is valid" but the server would reject it because someone updated only one side. By importing the same file, both sides enforce the exact same rules. This is the recommended pattern for full-stack apps where you control both ends.

### "Why does the server import a file from `/src`? Doesn't `/src` belong to the client?"

`src/validators.js` is a **shared utility** — it has no React, no DOM access, no Node APIs. It's pure JavaScript that works in both environments. The folder name `src` is just convention; the file itself is environment-agnostic. The alternative would be a third top-level folder like `/shared` but for a project this size, that's overkill.

### "Why is there mock data instead of just hooking up the real API now?"

Two reasons:
1. **The frontend can be developed without waiting on the backend.** Jon can build UI against mock data immediately. When Clonexstax replaces the mock with real fetches, nothing on Jon's side has to change.
2. **The demo is more reliable.** Mock data is deterministic. AA100 always shows the same status, the same position. Real APIs can rate-limit, return weird edge cases, or have outages right when you start presenting.

You can flip between mock and real by editing the service files.

### "What's the difference between the Home page and the Flight Detail page calling the same flight?"

- Home page → `<FlightCard>` → small summary, 60-second polling
- Flight Detail page → full view with map and weather, 30-second polling

Same data source, different views, different refresh rates.

### "Why do we have a Footer? It's tiny."

Class projects look more complete with a footer (copyright, team credits). Costs nothing to keep.

### "What does PWA actually mean?"

Progressive Web App. A regular website that:
1. Has a manifest (so the browser knows it's installable)
2. Has a service worker (so it works offline)
3. Is served over HTTPS (or localhost for testing)

When all three are present, Chrome and Edge offer an "Install" button in the address bar. Once installed, the site opens in its own window with no browser chrome — looks like a native app. **It's still just a website underneath.** No iOS or Android compilation, no app stores.

---

## How to test that everything works

After any major change, run through this list:

1. `npm install` doesn't error
2. `npm start` boots both servers, no errors in either
3. `http://localhost:5173` loads the home page
4. Searching `AA100` navigates to the detail page
5. The detail page shows airline info, route, weather panels
6. Clicking "Track this flight" adds it to the home page's tracked list
7. Refreshing the browser keeps the tracked list (localStorage works)
8. Clicking "Share link" copies a URL to clipboard
9. Opening `/share/<some-id>` shows the read-only view (need a real shareId)
10. `/api/health` returns `{"ok": true, ...}`
11. `npm run build` completes without errors
12. `set NODE_ENV=production && npm run server` then `http://localhost:3001` loads the built app
13. DevTools → Application → Manifest shows no errors
14. DevTools → Application → Service Workers shows `sw.js` activated
15. Chrome's address bar shows the install icon

If any of these fail, that's where to look.
