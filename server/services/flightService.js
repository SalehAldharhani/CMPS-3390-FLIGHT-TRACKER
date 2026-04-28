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

const MOCK_FLIGHTS = {
  AA100: {
    flightNumber: 'AA100',
    airline: 'American Airlines',
    status: 'EN_ROUTE',
    origin:      { iata: 'JFK', city: 'New York', lat: 40.6413, lon: -73.7781 },
    destination: { iata: 'LHR', city: 'London',   lat: 51.4700, lon: -0.4543  },
    departure:   { scheduled: isoOffset(-3 * 60), actual: isoOffset(-3 * 60 + 12), gate: 'B22' },
    arrival:     { scheduled: isoOffset(4 * 60),  estimated: isoOffset(4 * 60 + 8), gate: 'T5' },
    position:    { lat: 50.1, lon: -30.2, altitude: 37000, heading: 76, groundSpeed: 488 },
    aircraft:    { model: 'B777-300ER', registration: 'N729AN' },
  },
  BA2490: {
    flightNumber: 'BA2490',
    airline: 'British Airways',
    status: 'SCHEDULED',
    origin:      { iata: 'LHR', city: 'London',   lat: 51.4700, lon: -0.4543 },
    destination: { iata: 'CDG', city: 'Paris',    lat: 49.0097, lon: 2.5479  },
    departure:   { scheduled: isoOffset(2 * 60),  actual: null, gate: 'A14' },
    arrival:     { scheduled: isoOffset(3 * 60 + 25), estimated: null, gate: '2E' },
    position:    null,
    aircraft:    { model: 'A320neo', registration: 'G-TTNA' },
  },
};

function isoOffset(minutesFromNow) {
  return new Date(Date.now() + minutesFromNow * 60_000).toISOString();
}

/** Returns the flight object or null if not found. */
export async function fetchFlightFromProvider(flightNumber) {
  // ---------- TODO: BACKEND - replace this block with real API call -------
  await sleep(150); // simulate latency
  return MOCK_FLIGHTS[flightNumber] ?? null;
  // -------------------------------------------------------------------------
}

/** Returns an array of flights matching a free-text query. */
export async function searchFlightsFromProvider(query) {
  // ---------- TODO: BACKEND - replace with real search ---------------------
  const q = query.toUpperCase();
  return Object.values(MOCK_FLIGHTS).filter(f =>
    f.flightNumber.includes(q) ||
    f.airline.toUpperCase().includes(q) ||
    f.origin.iata.includes(q) ||
    f.destination.iata.includes(q)
  );
  // -------------------------------------------------------------------------
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
