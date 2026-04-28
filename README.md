# Flight Tracker — Project 3

A progressive web app (PWA) that tracks live flights with weather context for both origin and destination airports. Each tracked flight gets a shareable deep link so family and friends can follow along.

> **Stack:** React (Vite) on the front end · Express on the back end · Vanilla CSS with design tokens · vite-plugin-pwa for installable desktop/mobile experience.

---

## Team & Ownership

| Person | Role | Primary files |
|---|---|---|
| **Jon** | Front End | `src/components/`, `src/apiClient.js`, `src/App.jsx`, `src/main.jsx` |
| **Clonexstax** | Back End | `server/`, especially `server/services/*` (real API integrations) |
| **JASD3EP** | Design | `src/styles/app.css` (everything visual lives here) |

Each file has an `OWNER:` comment at the top. Stick to your files unless you coordinate first — that's how three people work in parallel without merge hell.

---

## Quick start

```bash
# 1. Install
npm install

# 2. Copy env file and fill in API keys when you have them
cp .env.example .env

# 3. Run client + server together (recommended)
npm start
# Client → http://localhost:5173
# Server → http://localhost:3001
# Vite proxies /api/* to the server automatically.

# Or run them separately:
npm run dev          # client only
npm run server:dev   # server only with --watch
```

The skeleton ships with **mock flight + weather data** so the front end works immediately. Real API calls are clearly marked `TODO: BACKEND` in `server/services/`.

---

## Project structure

```
flight-tracker/
├── docs/                    Preparation-phase docs (user stories, architecture, etc.)
├── public/                  Static assets served at /
├── server/                  Express backend (Clonexstax)
│   ├── index.js             App entry — mounts routes, middleware, prod static
│   ├── routes/              Express routers (one file per resource)
│   ├── controllers/         Pure server-side controllers — request → response
│   ├── services/            Talk to 3rd-party APIs (FlightRadar24, weather)
│   └── middleware/          errorHandler, rateLimiter
├── src/                     React client
│   ├── main.jsx             Entry point — wraps App in Router + FlightProvider
│   ├── App.jsx              Top-level route map
│   ├── apiClient.js         Talks to /api/* — the only place we call fetch()
│   ├── validators.js        Validation helpers, shared with the server
│   ├── components/          All React components and the page-level views
│   ├── models/              Client-side data model classes (Flight, Weather)
│   └── styles/              app.css — every style in one file
├── index.html               Vite entry HTML
├── vite.config.js           Vite config + dev proxy to :3001
└── package.json
```

---

## The frontend ↔ backend contract

The frontend never calls 3rd-party APIs directly. It only talks to **our** Express server, which proxies, normalises, and protects the keys.

| Endpoint | Returns | Notes |
|---|---|---|
| `GET /api/flights/:flightNumber` | `Flight` JSON | Validated against `validateFlightNumber` on both ends |
| `GET /api/flights/search?q=…` | `Flight[]` | Free-text search |
| `GET /api/weather?lat=…&lon=…` | `Weather` JSON | Bounds-checked lat/lon |
| `POST /api/share` `{ flightNumber }` | `{ shareId, url }` | Mints a 7-day deep link |
| `GET /api/share/:shareId` | `Flight` JSON | Public read-only snapshot |
| `GET /api/health` | `{ ok, ts }` | Liveness probe |

The exact JSON shape for `Flight` and `Weather` is documented at the top of `src/models/Flight.js` and `src/models/Weather.js`. **The backend must produce that shape** — that's the contract.

---

## Spec requirement coverage

### Preparation Phase (need ≥ 4 of 6)

- [x] **User Profiles / Stories** → `docs/user-stories.md`
- [x] **Features / Requirements** → `docs/features.md`
- [x] **App Architecture Document** → `docs/architecture.md`
- [x] **Style Guide / UI Design** → `docs/style-guide.md`
- [x] **Research log** → `docs/research-log.md`
- [ ] Relational DB Schema *(optional — only if we add Postgres/SQLite)*

### Required main features

- [x] **Version control** → `.gitignore` ready, init `git` and push to GitHub
- [x] **Pure server-side controller** → `server/controllers/flightController.js`
- [x] **At least 2 HTTP API calls from the client** → `apiClient.js` exposes `fetchFlight`, `searchFlights`, `fetchWeather`, `createShareLink`, `fetchSharedFlight`
- [x] **Client-side data model classes** → `src/models/Flight.js`, `src/models/Weather.js`
- [x] **Well designed Graphical UI/UX** → JASD3EP owns this; tokens in `src/styles/app.css`

### Additional features — the 5 our team picked (need ≥ 4)

- [x] **Persistent data storage** → `localStorage` for tracked flights via `FlightContext`; in-memory share store on the server (stretch: upgrade to SQLite)
- [x] **Client/Server data validation/sanitization** → `src/validators.js` re-used on both sides; flight-number format check + email/password validators + `validateSafeText` rejects SQL/script-injection characters
- [x] **3rd-party APIs/integrations** → FlightRadar24 (or OpenSky/AviationStack) + a weather provider; integration slots ready in `server/services/`
- [x] **API testing** → Postman/Insomnia collection at `docs/api-collection.json` *(TODO — see PROJECT_GUIDE.md)*
- [x] **State-handling with async functions** → `useFlight.js` uses async/await + AbortController; `WeatherPanel.jsx` uses `Promise.all` for parallel weather fetches; `apiClient.js` wraps fetch with timeouts

That's all 5 of our chosen features — one over the required 4.

---

## Git workflow

```bash
git init
git add .
git commit -m "Initial skeleton"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

**Branch convention:**
- `main` — always works
- `frontend/<feature>` — Jon's branches
- `backend/<feature>` — Clonexstax's branches
- `design/<change>` — JASD3EP's branches

Open PRs into `main`. Aim for small, reviewable commits.

---

## What still needs picking up

1. **Real API keys + integrations** — FlightRadar24 and weather provider (Clonexstax). Slots marked `TODO: BACKEND` in `server/services/`.
2. **Map library** — pick Mapbox GL JS, MapLibre, or Leaflet, then build out `src/components/FlightMap.jsx`. Notes inside that file.
3. **Real fonts + final palette** — JASD3EP. All values live in `src/styles/theme.css`. Replace placeholders with the real design system.
4. **PWA icons** — drop `pwa-192.png` and `pwa-512.png` in `public/`.
5. **Tests** — even just one round of API testing with Postman/Insomnia covers the "API testing" spec item.
