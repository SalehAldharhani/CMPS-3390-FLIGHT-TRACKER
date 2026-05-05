# Flight Tracker — Project 3

### Currently Live on https://cmps-3390-flight-tracker.onrender.com/
---

A progressive web app (PWA) that tracks live flights with weather context for both origin and destination airports. Each tracked flight gets a shareable deep link so family and friends can follow along.

> **Stack:** React (Vite) on the front end · Express on the back end · Vanilla CSS with design tokens · vite-plugin-pwa for installable desktop/mobile experience.

---

## Team & Ownership

| Person | Role | Primary files |
|---|---|---|
| **Jonathan Torres** | Front End | `src/components/`, `src/apiClient.js`, `src/App.jsx`, `src/main.jsx` |
| **Saleh Al-Dharhani** | Back End | `server/`, especially `server/services/*` (real API integrations) |
| **Jasdeep Singh** | Design | `src/styles/app.css` (everything visual lives here) |

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

The exact JSON shape for `Flight` and `Weather` is documented at the top of `src/models/Flight.js` and `src/models/Weather.js`. **The backend must produce that shape**

---

## Spec requirement coverage

### Preparation Phase (need ≥ 4 of 6)

- [x] **User Profiles / Stories** → `docs/user-stories.md`
- [x] **Features / Requirements** → `docs/features.md`
- [x] **App Architecture Document** → `docs/architecture.md`
- [x] **Style Guide / UI Design** → `docs/style-guide.md`
- [x] **Research log** → `docs/research-log.md`

### Required main features

- [x] **Version control** 
- [x] **Pure server-side controller** → `server/controllers/flightController.js`
- [x] **At least 2 HTTP API calls from the client** → `apiClient.js` exposes `fetchFlight`, `searchFlights`, `fetchWeather`, `createShareLink`, `fetchSharedFlight`
- [x] **Client-side data model classes** → `src/models/Flight.js`, `src/models/Weather.js`
- [x] **Well designed Graphical UI/UX** →  `src/styles/app.css`

### Additional features — the 5 our team picked (need ≥ 4)

- [x] **Persistent data storage** → `localStorage` for **per-user account data** (`AuthContext`) and tracked flights (`FlightContext`, scoped per user);
- [x] **Client/Server data validation/sanitization** → `src/validators.js`
- [x] **3rd-party APIs/integrations** → FlightRadar24 + a weather provider; integration slots ready in `server/services/`
- [x] **API testing** → Postman/Insomnia collection at `docs/api-collection.json`
- [x] **State-handling with async functions** → `useFlight.js` uses async/await + AbortController; `WeatherPanel.jsx` uses `Promise.all` for parallel weather fetches; `apiClient.js` wraps fetch with timeouts

That's all 5 of our chosen features — one over the required 4.

---

## Git workflow

The repo is on GitHub. To clone and start working:

```bash
git clone <repo-url>
cd flight-tracker
npm install
npm start
```

To work on a feature:

```bash
git checkout -b your-branch-name
# ...edit files...
git add .
git commit -m "what you changed"
git push -u origin your-branch-name
```

Then open a PR on GitHub and have a teammate review before merging into `main`.
Open PRs into `main`. Aim for small, reviewable commits.

