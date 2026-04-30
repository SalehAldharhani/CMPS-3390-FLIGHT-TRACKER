/**
 * apiClient.js
 * --------------------------------------------------------------------------
 * The frontend talks ONLY to our own Express backend (`/api/*`).
 * The backend is the one that talks to FlightRadar24, the weather provider,
 * etc. - so API keys never leak to the client and we can cache/normalise
 * responses server-side.
 *
 * OWNER: Jon (front-end) writes calls; Clonexstax (back-end) implements
 * the matching routes in /server/routes.
 */

import Flight from './models/Flight.js';
import Weather from './models/Weather.js';

// In dev, VITE_API_BASE is empty → Vite's proxy sends /api/* to localhost:3001.
// In prod, set VITE_API_BASE in .env.production to the deployed backend URL,
// e.g. https://flight-tracker-api.onrender.com -- see docs/deployment.md.
const BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api';

/** Tiny fetch wrapper with timeout + JSON parsing + error normalisation. */
async function request(path, { method = 'GET', body, signal, timeoutMs = 10_000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const realSignal = signal ?? ctrl.signal;

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: realSignal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ApiError(`Request failed: ${res.status}`, res.status, text);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export class ApiError extends Error {
  constructor(msg, status, body) {
    super(msg);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// Flights
// ---------------------------------------------------------------------------

/** GET /api/flights/:flightNumber -> Flight (live position only, 1 credit) */
export async function fetchFlight(flightNumber, opts) {
  const json = await request(`/flights/${encodeURIComponent(flightNumber)}`, opts);
  return Flight.fromApi(json);
}

/** GET /api/flights/:flightNumber/details -> Flight (live + summary, 2 credits) */
export async function fetchFlightDetails(flightNumber, opts) {
  const json = await request(`/flights/${encodeURIComponent(flightNumber)}/details`, opts);
  return Flight.fromApi(json);
}

/** GET /api/flights/search?q=... -> Flight[] */
export async function searchFlights(query, opts) {
  const json = await request(`/flights/search?q=${encodeURIComponent(query)}`, opts);
  return (json ?? []).map(Flight.fromApi);
}

// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------

/** GET /api/weather?lat=..&lon=.. -> Weather */
export async function fetchWeather({ lat, lon }, opts) {
  const json = await request(`/weather?lat=${lat}&lon=${lon}`, opts);
  return Weather.fromApi(json);
}

// ---------------------------------------------------------------------------
// Sharing
// ---------------------------------------------------------------------------

/** POST /api/share { flightNumber } -> { shareId, url } */
/** POST /api/share { flightNumber, sharedBy? } -> { shareId, url } */
export async function createShareLink(flightNumber, opts = {}) {
  const { sharedBy, ...fetchOpts } = opts;
  return request('/share', {
    method: 'POST',
    body: { flightNumber, sharedBy },
    ...fetchOpts,
  });
}

/** GET /api/share/:shareId -> Flight (read-only snapshot) */
/** GET /api/share/:shareId -> { flight: Flight, sharedBy: string|null } */
export async function fetchSharedFlight(shareId, opts) {
  const json = await request(`/share/${encodeURIComponent(shareId)}`, opts);
  return {
    flight:   Flight.fromApi(json.flight),
    sharedBy: json.sharedBy ?? null,
  };
}
