# App Architecture

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Browser (PWA)                                  │
│                                                                         │
│   ┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│   │  React Pages    │───▶│  React Hooks     │───▶│  apiClient.js    │  │
│   │  HomePage       │    │  useFlight       │    │  fetch wrapper   │  │
│   │  FlightDetail   │    │                  │    │  +  Flight model │  │
│   │  SharedFlight   │    │                  │    │  +  Weather model│  │
│   └────────┬────────┘    └──────────────────┘    └────────┬─────────┘  │
│            │                                              │            │
│            ▼                                              │            │
│   ┌─────────────────┐                                     │            │
│   │  FlightContext  │ ── localStorage (tracked flights)   │            │
│   └─────────────────┘                                     │            │
└───────────────────────────────────────────────────────────┼────────────┘
                                                            │ /api/*
                                                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Express Server (Node)                             │
│                                                                         │
│   ┌──────────────┐    ┌────────────────┐    ┌─────────────────────┐    │
│   │  Routes      │───▶│  Controllers   │───▶│  Services           │    │
│   │  flights.js  │    │  flightCtrl    │    │  flightService.js   │────┼─▶ FlightRadar24
│   │  weather.js  │    │  weatherCtrl   │    │  weatherService.js  │────┼─▶ Weather API
│   │  share.js    │    │  shareCtrl     │    │  (in-memory share)  │    │
│   └──────────────┘    └────────────────┘    └─────────────────────┘    │
│         ▲                                                               │
│         │  rate limiter, error handler, JSON body parser                │
└─────────┴───────────────────────────────────────────────────────────────┘
```

## Layers explained

### Client side

**Pages** are wired to routes in `App.jsx`. They orchestrate components and own URL params (like `flightNumber` from `useParams`).

**Components** are dumb. They receive props and call back through context or hooks. They don't know about HTTP.

**Hooks** (`useFlight`) wrap async fetch logic. This is where loading / error states live. Components stay clean.

**Context** (`FlightContext`) holds app-level state — currently just the list of tracked flight numbers. Persists to `localStorage` on every change.

**Models** (`Flight`, `Weather`) are classes that wrap raw API JSON. They expose computed properties like `routeLabel`, `progressPercent`, `flightImpact` so views don't have to compute these themselves.

**API client** (`apiClient.js`) is the *only* place that calls `fetch`. Every request goes through one wrapper that handles timeouts, JSON parsing, and error normalization. Returns Model instances, not raw JSON.

### Server side

**Routes** map HTTP paths to controller functions. Tiny files.

**Controllers** are pure server-side handlers. They:
- Validate request input (re-using the client validators).
- Call services.
- Map results into JSON responses with the right status codes.
- Forward errors to the central error handler.

**Services** are where the actual data work happens. They:
- Call 3rd-party APIs (FlightRadar24, weather provider).
- Normalize the response into our model shape.
- Cache when appropriate.

**Middleware** wraps every request: CORS, JSON body parsing, rate limiting, central error handling.

---

## Why this layout

We pick **MVC-ish** on the server because it's the simplest pattern that gives clean ownership boundaries:

- Anyone changing the API surface touches `routes/` and `controllers/`.
- Anyone changing the upstream provider touches `services/`.
- Anyone changing how errors are handled touches `middleware/`.

On the client we use **a model + hooks + context** pattern (close to MVVM):
- Models = the V**M** in MVVM.
- Hooks expose model state to components.
- Context keeps cross-page state out of prop chains.

## Design patterns used

| Pattern | Where | Why |
|---|---|---|
| **Factory method** | `Flight.fromApi`, `Weather.fromApi` | Constructing typed instances from arbitrary JSON — keeps the constructor for default use and the static method for the parsing case. |
| **Module pattern** | `apiClient.js` | One module exports a small set of related functions over a shared `request` helper. |
| **Singleton (de facto)** | `FlightContext` provider | One instance per app, holds shared state. |
| **Strategy (lightweight)** | `Flight.statusToken` | The same status string is mapped to different rendering strategies (CSS classes, labels). |

## Concurrency model

The app is single-threaded JS, but uses concurrent async work:

- `WeatherPanel` issues two weather fetches in parallel via `Promise.all`.
- `useFlight` runs background polling on an interval, with an `AbortController` so unmounting cancels in-flight requests.
- The server's rate limiter is per-IP; each request is independent so requests from different IPs don't block each other.

If we add a Web Worker for map calculations, that would tick the **concurrency/multithreading** spec item — currently a stretch goal.

---

## Persistence strategy

| Data | Where | TTL |
|---|---|---|
| Tracked flight numbers | Browser `localStorage` | Until user clears |
| Share links | Server in-memory `Map` | 7 days |
| Flight & weather data | Not persisted; fetched on demand | n/a |

If we add a real DB later, it would store: share links (durable), and optionally user accounts + saved flights.

---

## Deployment plan (post-skeleton)

1. `npm run build` produces a static client in `dist/`.
2. The Express server with `NODE_ENV=production` serves both the API and the static client on a single port.
3. One deployment artifact = one service. Easy to host on Render, Railway, Fly.io, or a single VM.
