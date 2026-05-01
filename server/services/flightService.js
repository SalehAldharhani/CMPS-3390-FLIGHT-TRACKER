import { lookupAirport } from '../data/airports.js';
import { cacheGet, cacheSet } from './cache.js';

const FR24_API_KEY = process.env.FLIGHTRADAR24_API_KEY;
const FR24_BASE    = 'https://fr24api.flightradar24.com/api';

const LIVE_TTL_MS       = 60_000;
const SUMMARY_TTL_MS    = 5 * 60_000;
const HISTORICAL_TTL_MS = 24 * 60 * 60_000;

function fr24Headers() {
  return {
    'Accept':         'application/json',
    'Accept-Version': 'v1',
    'Authorization':  `Bearer ${FR24_API_KEY}`,
  };
}

function mapLiveFlight(raw) {
  const origin      = lookupAirport(raw.orig_iata);
  const destination = lookupAirport(raw.dest_iata);

  const status = 'EN_ROUTE';

  const airline = raw.painted_as ?? raw.operating_as ?? 'Unknown';

  return {
    flightNumber: raw.flight ?? raw.callsign ?? 'N/A',
    airline,
    status,

    origin,
    destination,

    departure: { scheduled: null, actual: null, gate: null, runway: null },
    arrival:   { scheduled: null, estimated: raw.eta ?? null, gate: null, runway: null },

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
      model:        raw.type ?? 'Unknown',
      registration: raw.reg  ?? 'N/A',
    },
  };
}

const RATE_LIMIT_BACKOFF_MS = 90_000;
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

export async function fetchFlightFromProvider(flightNumber) {
  if (!FR24_API_KEY) throw new Error('FLIGHTRADAR24_API_KEY is not set in .env');

  const cacheKey = `live:${flightNumber}`;
  const cached = cacheGet(cacheKey);
  if (cached !== null) return cached;

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

  if (flights.length === 0) {
    cacheSet(cacheKey, null, LIVE_TTL_MS);
    return null;
  }

  const flight = mapLiveFlight(flights[0]);
  cacheSet(cacheKey, flight, LIVE_TTL_MS);
  return flight;
}

export async function fetchFlightDetailsFromProvider(flightNumber) {
  if (!FR24_API_KEY) throw new Error('FLIGHTRADAR24_API_KEY is not set in .env');

  const live = await fetchFlightFromProvider(flightNumber);
  if (!live) return null;

  const summaryKey = `summary:${flightNumber}`;
  let summary = cacheGet(summaryKey);
  if (summary === null) {
    summary = await fetchFlightSummary(flightNumber);
    cacheSet(summaryKey, summary, SUMMARY_TTL_MS);
  }

  if (summary) {
    return {
      ...live,
      departure: {
        scheduled: null,
        actual:    summary.datetime_takeoff ?? null,
        gate:      null,
        runway:    summary.runway_takeoff ?? null,
      },
      arrival: {
        scheduled: null,
        estimated: live.arrival.estimated,
        gate:      null,
        runway:    summary.runway_landed ?? null,
      },
    };
  }

  return live;
}

async function fetchFlightSummary(flightNumber) {
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
    return null;
  }
}

export async function fetchLastFlightFromProvider(flightNumber) {
  if (!FR24_API_KEY) throw new Error('FLIGHTRADAR24_API_KEY is not set in .env');

  const cacheKey = `last:${flightNumber}`;
  const cached = cacheGet(cacheKey);
  if (cached !== null) return cached;

  checkRateLimit();

  const summary = await fetchFlightSummary(flightNumber);
  if (!summary) {
    cacheSet(cacheKey, null, HISTORICAL_TTL_MS);
    return null;
  }

  const origin      = lookupAirport(summary.orig_iata);
  const destination = lookupAirport(summary.dest_iata_actual ?? summary.dest_iata);

  const status = summary.flight_ended ? 'LANDED' : 'EN_ROUTE';

  const flight = {
    flightNumber: summary.flight ?? flightNumber,
    airline:      summary.painted_as ?? summary.operating_as ?? 'Unknown',
    status,

    origin,
    destination,

    departure: {
      scheduled: null,
      actual:    summary.datetime_takeoff ?? null,
      gate:      null,
      runway:    summary.runway_takeoff ?? null,
    },
    arrival: {
      scheduled: null,
      estimated: summary.datetime_landed ?? null,
      gate:      null,
      runway:    summary.runway_landed ?? null,
    },

    position: (destination.lat !== 0 || destination.lon !== 0)
      ? {
          lat:         destination.lat,
          lon:         destination.lon,
          altitude:    0,
          heading:     0,
          groundSpeed: 0,
        }
      : null,

    aircraft: {
      model:        summary.type ?? 'Unknown',
      registration: summary.reg  ?? 'N/A',
    },

    isHistorical: true,
  };

  cacheSet(cacheKey, flight, HISTORICAL_TTL_MS);
  return flight;
}


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
