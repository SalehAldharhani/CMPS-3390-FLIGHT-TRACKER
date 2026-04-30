/**
 * flightService.js
 * --------------------------------------------------------------------------
 * OWNER: Clonexstax
 *
 * This is where the real call to FlightRadar24 (or whichever provider we
 * choose) lives. Until we have a real API key the functions return mock
 * data so the front end can keep developing.
 *
 * EXPECTED RETURN SHAPE (must match src/models/Flight.js):
 *   {
 *     flightNumber, airline, status,
 *     origin:      { iata, city, lat, lon },
 *     destination: { iata, city, lat, lon },
 *     departure:   { scheduled, actual, gate },
 *     arrival:     { scheduled, estimated, gate },
 *     position:    { lat, lon, altitude, heading, groundSpeed } | null,
 *     aircraft:    { model, registration }
 *   }
 *
 * TODO: BACKEND
 *   1. Pick the provider (FlightRadar24, AviationStack, OpenSky free tier).
 *   2. Add the API key to .env as FLIGHTRADAR24_API_KEY.
 *   3. Replace the mock body of fetchFlightFromProvider with a real fetch().
 *   4. Map the provider's payload into the shape above.
 *   5. Optionally add an in-memory cache (15-30s) to reduce upstream calls.
 */


const FR24_API_KEY = process.env.FLIGHTRADAR24_API_KEY;
const FR24_BASE    = 'https://fr24api.flightradar24.com/api';
 
// ---------------------------------------------------------------------------
// Helper – shared headers for every FR24 request
// ---------------------------------------------------------------------------
function fr24Headers() {
  return {
    'Accept':        'application/json',
    'Accept-Version': 'v1',
    'Authorization': `Bearer ${FR24_API_KEY}`,
  };
}


function mapStatus(raw) {
  const map = {
    'EN_ROUTE':  'EN_ROUTE',
    'LANDED':    'LANDED',
    'SCHEDULED': 'SCHEDULED',
    'CANCELLED': 'CANCELLED',
    'DELAYED':   'DELAYED',
    'DIVERTED':  'DIVERTED',
  };
  return map[raw?.toUpperCase()] ?? raw ?? 'UNKNOWN';
}

function mapFlight(f) {
  // FR24 live endpoint nests data differently from the summary endpoint;
  // we handle both shapes safely with optional chaining.
  const dep = f.airport?.origin    ?? f.origin      ?? {};
  const arr = f.airport?.destination ?? f.destination ?? {};
 
  return {
    flightNumber: f.flight?.identification?.number?.default
                  ?? f.flightNumber
                  ?? 'N/A',
 
    airline: f.airline?.name ?? f.airline ?? 'Unknown',
 
    status: mapStatus(f.status?.live ? 'EN_ROUTE' : f.status?.generic?.status?.text),
 
    origin: {
      iata: dep.code?.iata  ?? dep.iata  ?? '',
      city: dep.info?.name  ?? dep.city  ?? '',
      lat:  dep.position?.latitude  ?? dep.lat ?? 0,
      lon:  dep.position?.longitude ?? dep.lon ?? 0,
    },
 
    destination: {
      iata: arr.code?.iata  ?? arr.iata  ?? '',
      city: arr.info?.name  ?? arr.city  ?? '',
      lat:  arr.position?.latitude  ?? arr.lat ?? 0,
      lon:  arr.position?.longitude ?? arr.lon ?? 0,
    },
 
    departure: {
      scheduled: f.time?.scheduled?.departure
                 ? new Date(f.time.scheduled.departure * 1000).toISOString()
                 : null,
      actual:    f.time?.real?.departure
                 ? new Date(f.time.real.departure * 1000).toISOString()
                 : null,
      gate:      f.airport?.origin?.info?.gate ?? null,
    },
 
    arrival: {
      scheduled: f.time?.scheduled?.arrival
                 ? new Date(f.time.scheduled.arrival * 1000).toISOString()
                 : null,
      estimated: f.time?.estimated?.arrival
                 ? new Date(f.time.estimated.arrival * 1000).toISOString()
                 : null,
      gate:      f.airport?.destination?.info?.gate ?? null,
    },
 
    position: f.trail?.[0]
      ? {
          lat:         f.trail[0].lat,
          lon:         f.trail[0].lng,
          altitude:    f.trail[0].alt,
          heading:     f.trail[0].hd,
          groundSpeed: f.trail[0].spd,
        }
      : null,
 
    aircraft: {
      model:        f.aircraft?.model?.text ?? f.aircraft?.model ?? 'Unknown',
      registration: f.aircraft?.registration ?? 'N/A',
    },
  };
}
// const MOCK_FLIGHTS = {
//   AA100: {
//     flightNumber: 'AA100',
//     airline: 'American Airlines',
//     status: 'EN_ROUTE',
//     origin:      { iata: 'JFK', city: 'New York', lat: 40.6413, lon: -73.7781 },
//     destination: { iata: 'LHR', city: 'London',   lat: 51.4700, lon: -0.4543  },
//     departure:   { scheduled: isoOffset(-3 * 60), actual: isoOffset(-3 * 60 + 12), gate: 'B22' },
//     arrival:     { scheduled: isoOffset(4 * 60),  estimated: isoOffset(4 * 60 + 8), gate: 'T5' },
//     position:    { lat: 50.1, lon: -30.2, altitude: 37000, heading: 76, groundSpeed: 488 },
//     aircraft:    { model: 'B777-300ER', registration: 'N729AN' },
//   },
//   BA2490: {
//     flightNumber: 'BA2490',
//     airline: 'British Airways',
//     status: 'SCHEDULED',
//     origin:      { iata: 'LHR', city: 'London',   lat: 51.4700, lon: -0.4543 },
//     destination: { iata: 'CDG', city: 'Paris',    lat: 49.0097, lon: 2.5479  },
//     departure:   { scheduled: isoOffset(2 * 60),  actual: null, gate: 'A14' },
//     arrival:     { scheduled: isoOffset(3 * 60 + 25), estimated: null, gate: '2E' },
//     position:    null,
//     aircraft:    { model: 'A320neo', registration: 'G-TTNA' },
//   },
// };

// function isoOffset(minutesFromNow) {
//   return new Date(Date.now() + minutesFromNow * 60_000).toISOString();
// }

/** Returns the flight object or null if not found. */
export async function fetchFlightFromProvider(flightNumber) {
  if (!FR24_API_KEY) throw new Error('FLIGHTRADAR24_API_KEY is not set in .env');
  
  const url = `${FR24_BASE}/live/flight-positions/full?flights=${encodeURIComponent(flightNumber)}`;
 
  const res = await fetch(url, { headers: fr24Headers() });
 
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`FR24 error ${res.status}: ${body}`);
  }
 
  const json = await res.json();
 
  // The live endpoint returns { data: [ ...flights ] }
  const flights = json?.data ?? [];
  if (flights.length === 0) return null;
 
  return mapFlight(flights[0]);
}

/** Returns an array of flights matching a free-text query. */
export async function searchFlightsFromProvider(query) {
  if (!FR24_API_KEY) throw new Error('FLIGHTRADAR24_API_KEY is not set in .env');
 
  // FR24 search endpoint
  const url = `${FR24_BASE}/live/flight-positions/full?flights=${encodeURIComponent(query.toUpperCase())}`;
 
  const res = await fetch(url, { headers: fr24Headers() });
 
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`FR24 search error ${res.status}: ${body}`);
  }
  // -------------------------------------------------------------------------

  const json = await res.json();
  const flights = json?.data ?? [];
 
  return flights.map(mapFlight);
}

// function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
