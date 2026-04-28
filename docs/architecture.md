# App Architecture

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Browser (PWA)                                  │
│                                                                         │
│   ┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│   │  React Pages    │───▶│  React Hooks     │───▶│  apiClient.js    │  │
│   │  HomePage*      │    │  useFlight       │    │  fetch wrapper   │  │
│   │  FlightDetail*  │    │                  │    │  +  Flight model │  │
│   │  SharedFlight   │    │                  │    │  +  Weather model│  │
│   │  Login/Signup   │    │                  │    │                  │  │
│   └────────┬────────┘    └──────────────────┘    └────────┬─────────┘  │
│            │  * = wrapped in <RequireAuth>                │            │
│            ▼                                              │            │
│   ┌─────────────────┐  ┌─────────────────┐                │            │
│   │  AuthContext    │  │  FlightContext  │                │            │
│   │  users + current│  │  per-user list  │                │            │
│   └────────┬────────┘  └────────┬────────┘                │            │
│            │                    │                         │            │
│            └──── localStorage ──┘                         │            │
│              ft.users.v1                                  │            │
│              ft.currentUser.v1                            │            │
│              ft.trackedFlights.v2.<username>              │            │
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

**Context** holds app-level state without prop drilling. We have two:
- `AuthContext` — the user "database" (`ft.users.v1`) and the currently signed-in username (`ft.currentUser.v1`). Exposes `signUp`, `signIn`, `signOut`, `currentUser`, `isSignedIn`.
- `FlightContext` — the list of tracked flight numbers, scoped per signed-in user (`ft.trackedFlights.v2.<username>`). Reads `currentUser` from `AuthContext`, which is why `AuthProvider` wraps `FlightProvider` in `main.jsx`.

Both persist to `localStorage` on every change.

**Route protection** is done by `<RequireAuth>` in `App.jsx`. It wraps the protected pages (Home, Flight Detail) and redirects to `/login` if the user isn't signed in. Share links (`/share/:shareId`) are intentionally *not* wrapped, so anyone with a link can view a flight without signing up.

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

| Data | Where | Key | TTL |
|---|---|---|---|
| User accounts | Browser `localStorage` | `ft.users.v1` | Until user clears |
| Current session | Browser `localStorage` | `ft.currentUser.v1` | Until sign out / clear |
| Tracked flight numbers | Browser `localStorage` | `ft.trackedFlights.v2.<username>` | Until user clears |
| Share links | Server in-memory `Map` | (random shareId) | 7 days |
| Flight & weather data | Not persisted; fetched on demand | — | n/a |

**About the auth design:** accounts are local-only (browser-side). This means accounts don't sync across devices or browsers, and passwords are stored in plaintext in localStorage. This is a deliberate scope decision — it gives the app a multi-user feel for the demo without needing a backend database, password hashing, session middleware, etc. Real server-side auth is documented as out of scope.

If we add a real DB later, it would store: share links (durable), user accounts (with hashed passwords), and tracked flights server-side keyed by user.

---

## Deployment plan (post-skeleton)

1. `npm run build` produces a static client in `dist/`.
2. The Express server with `NODE_ENV=production` serves both the API and the static client on a single port.
3. One deployment artifact = one service. Easy to host on Render, Railway, Fly.io, or a single VM.
