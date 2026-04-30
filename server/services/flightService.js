/**
 * flightService.js
 * --------------------------------------------------------------------------
 * Real FlightRadar24 API integration, written against the v1 OpenAPI schema.
 *
 * ============================================================================
 *  CHANGE LOG — what was wrong and what we fixed
 * ============================================================================
 *
 *  ROUND 1: The original implementation parsed an OLDER / internal FR24 API
 *  response shape (deeply nested f.flight.identification.number.default,
 *  f.airport.origin.code.iata, f.trail[0].lat, etc). The actual v1 public
 *  API returns FLAT fields. Almost every parser line was reading paths that
 *  don't exist, so even when HTTP 200 came back, every field was undefined.
 *
 *  ROUND 2: The /api/static/airports/{iata}/full endpoint that we used to
 *  look up city + coordinates returned 403 Forbidden — gated behind a
 *  higher subscription tier than ours. Without coordinates, map markers
 *  fell to (0, 0) and weather defaulted to that location.
 *  FIX: Local hardcoded airport database (server/data/airports.js).
 *
 *  ROUND 3 (THIS UPDATE): Two improvements:
 *    a. ADDED CACHING. Every flight lookup was hitting FR24 directly,
 *       burning credits on every poll, navigation, and refresh. We now
 *       cache live-position responses for 60 seconds. Multiple requests
 *       for the same flight within that window share one upstream call.
 *    b. ADDED FLIGHT-SUMMARY support. The live-positions endpoint doesn't
 *       return scheduled/actual departure times, runway info, or flight
 *       duration. /api/flight-summary/full does. fetchFlightDetails()
 *       calls BOTH endpoints and merges them — used only on the detail
 *       page to avoid doubling credit cost on the home page.
 *
 *  Specific bugs fixed and where:
 *
 *    1. flight number              flat f.flight                            // FIXED #1
 *    2. airline                    flat f.painted_as / f.operating_as       // FIXED #2
 *    3. origin/dest IATA           flat f.orig_iata / f.dest_iata           // FIXED #3
 *    4. origin/dest city + coords  local lookupAirport()                    // FIXED #4
 *    5. live position              flat f.lat, f.lon, f.alt, f.track, gspeed // FIXED #5
 *    6. aircraft type/reg          flat f.type, f.reg                       // FIXED #6
 *    7. status                     hardcoded EN_ROUTE (live endpoint only)  // FIXED #7
 *    8. departure/arrival          NOW from flight-summary when requested   // FIXED #8
 *
 * ============================================================================
 *
 * EXPECTED RETURN SHAPE (must match src/models/Flight.js):
 *   {
 *     flightNumber, airline, status,
 *     origin:      { iata, city, lat, lon },
 *     destination: { iata, city, lat, lon },
 *     departure:   { scheduled, actual, gate, runway },
 *     arrival:     { scheduled, estimated, gate, runway },
 *     position:    { lat, lon, altitude, heading, groundSpeed } | null,
 *     aircraft:    { model, registration }
 *   }
 */

import { lookupAirport } from '../data/airports.js';
import { cacheGet, cacheSet } from './cache.js';

const FR24_API_KEY = process.env.FLIGHTRADAR24_API_KEY;
const FR24_BASE    = 'https://fr24api.flightradar24.com/api';

// Cache TTLs — 60 seconds is short enough that "live" data still feels live,
// long enough to absorb refresh/navigation traffic without extra credits.
const LIVE_TTL_MS    = 60_000;
const SUMMARY_TTL_MS = 5 * 60_000; // summary is more stable, cache longer

function fr24Headers() {
  return {
    'Accept':         'application/json',
    'Accept-Version': 'v1',
    'Authorization':  `Bearer ${FR24_API_KEY}`,
  };
}

// --------------------------------------------------------------------------
// Map FR24 v1 live-positions schema -> our Flight shape
// --------------------------------------------------------------------------
function mapLiveFlight(raw) {
  // FIXED #4: Look up airports in our LOCAL database (free, instant).
  const origin      = lookupAirport(raw.orig_iata);
  const destination = lookupAirport(raw.dest_iata);

  // FIXED #7: live endpoint only returns airborne flights.
  const status = 'EN_ROUTE';

  // FIXED #2: ICAO airline code (e.g. "AAL"); good enough for display.
  const airline = raw.painted_as ?? raw.operating_as ?? 'Unknown';

  return {
    // FIXED #1: was f.flight.identification.number.default
    flightNumber: raw.flight ?? raw.callsign ?? 'N/A',
    airline,
    status,

    origin,
    destination,

    // FIXED #8: live endpoint doesn't have these. fetchFlightDetails()
    // overwrites these with real values from /api/flight-summary/full.
    departure: { scheduled: null, actual: null, gate: null, runway: null },
    arrival:   { scheduled: null, estimated: raw.eta ?? null, gate: null, runway: null },

    // FIXED #5: was f.trail[0].{lat,lng,alt,hd,spd}
    position: (raw.lat != null && raw.lon != null)
      ? {
          lat:         raw.lat,
          lon:         raw.lon,
          altitude:    raw.alt ?? 0,
          heading:     raw.track ?? 0,
          groundSpeed: raw.gspeed ?? 0,
        }
      : null,

    aircraft: {
      // FIXED #6: was f.aircraft.model.text
      model:        raw.type ?? 'Unknown',
      registration: raw.reg  ?? 'N/A',
    },
  };
}

// --------------------------------------------------------------------------
// Public functions called by the controller
// --------------------------------------------------------------------------

// Circuit breaker for rate limiting.
// When FR24 returns 429, we enter "tripped" mode for RATE_LIMIT_BACKOFF_MS.
// During that window, all FR24 calls fail fast WITHOUT contacting the API,
// so we don't keep extending the rate limit by hammering it.
const RATE_LIMIT_BACKOFF_MS = 90_000; // 90 seconds
let rateLimitedUntil = 0;

function checkRateLimit() {
  if (Date.now() < rateLimitedUntil) {
    const secsLeft = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
    throw new Error(`FR24 rate limit cooling down. Try again in ${secsLeft}s.`);
  }
}

function tripRateLimit() {
  rateLimitedUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
}

/**
 * Fetch live position only. Used by the home-page card poll.
 * Returns the flight object or null if not airborne.
 *
 * Caches for LIVE_TTL_MS. With multiple users tracking the same flight
 * (or the same user tracking it across pages), all requests within the
 * TTL share one upstream FR24 call.
 */
export async function fetchFlightFromProvider(flightNumber) {
  if (!FR24_API_KEY) throw new Error('FLIGHTRADAR24_API_KEY is not set in .env');

  const cacheKey = `live:${flightNumber}`;
  const cached = cacheGet(cacheKey);
  if (cached !== null) return cached;

  // If we recently got rate-limited, fail fast without contacting FR24.
  checkRateLimit();

  const url = `${FR24_BASE}/live/flight-positions/full?flights=${encodeURIComponent(flightNumber)}`;
  const res = await fetch(url, { headers: fr24Headers() });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 429) tripRateLimit();
    throw new Error(`FR24 error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const flights = Array.isArray(json?.data) ? json.data : [];

  // No airborne flight matches. Cache the null to avoid hammering FR24
  // when the user keeps refreshing a non-flying flight.
  if (flights.length === 0) {
    cacheSet(cacheKey, null, LIVE_TTL_MS);
    return null;
  }

  const flight = mapLiveFlight(flights[0]);
  cacheSet(cacheKey, flight, LIVE_TTL_MS);
  return flight;
}

/**
 * Fetch a flight + its summary (departure time, runway, etc).
 * Used ONLY by the detail page — costs 2 credits per cache miss
 * (live-position + flight-summary). Cached separately.
 */
export async function fetchFlightDetailsFromProvider(flightNumber) {
  if (!FR24_API_KEY) throw new Error('FLIGHTRADAR24_API_KEY is not set in .env');

  // Step 1: live position (uses the same cache as fetchFlightFromProvider)
  const live = await fetchFlightFromProvider(flightNumber);
  if (!live) return null;

  // Step 2: summary (separate cache key, longer TTL)
  const summaryKey = `summary:${flightNumber}`;
  let summary = cacheGet(summaryKey);
  if (summary === null) {
    summary = await fetchFlightSummary(flightNumber);
    cacheSet(summaryKey, summary, SUMMARY_TTL_MS);
  }

  // Merge summary fields into the live flight object.
  if (summary) {
    return {
      ...live,
      departure: {
        scheduled: null,                          // not provided by FR24 at our tier
        actual:    summary.datetime_takeoff ?? null,
        gate:      null,                          // not provided
        runway:    summary.runway_takeoff ?? null,
      },
      arrival: {
        scheduled: null,
        estimated: live.arrival.estimated,        // keep ETA from live
        gate:      null,
        runway:    summary.runway_landed ?? null,
      },
    };
  }

  // Summary lookup failed; return live data alone.
  return live;
}

/**
 * Internal: hit /api/flight-summary/full and return raw summary fields.
 * Returns the summary object, or null on miss/error.
 *
 * The summary endpoint requires a date range. We search the last 24 hours
 * and take the most recent leg matching the flight number.
 */
async function fetchFlightSummary(flightNumber) {
  // Skip if we know we're rate-limited.
  if (Date.now() < rateLimitedUntil) return null;

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    flights: flightNumber,
    flight_datetime_from: yesterday.toISOString().replace(/\.\d+Z$/, ''),
    flight_datetime_to:   now.toISOString().replace(/\.\d+Z$/, ''),
    sort:  'desc',
    limit: '1',
  });

  const url = `${FR24_BASE}/flight-summary/full?${params}`;

  try {
    const res = await fetch(url, { headers: fr24Headers() });
    if (res.status === 429) {
      tripRateLimit();
      return null;
    }
    if (!res.ok) return null;

    const json = await res.json();
    const items = Array.isArray(json?.data) ? json.data : [];
    return items[0] ?? null;
  } catch {
    return null; // summary is optional — don't break the page if it fails
  }
}

/** Search by flight number — uses live-positions, same cache. */
export async function searchFlightsFromProvider(query) {
  if (!FR24_API_KEY) throw new Error('FLIGHTRADAR24_API_KEY is not set in .env');

  const q = String(query).trim().toUpperCase();
  if (!q) return [];

  const cacheKey = `search:${q}`;
  const cached = cacheGet(cacheKey);
  if (cached !== null) return cached;

  checkRateLimit();

  const url = `${FR24_BASE}/live/flight-positions/full?flights=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: fr24Headers() });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 429) tripRateLimit();
    throw new Error(`FR24 search error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const flights = Array.isArray(json?.data) ? json.data : [];
  const result = flights.map(mapLiveFlight);

  cacheSet(cacheKey, result, LIVE_TTL_MS);
  return result;
}