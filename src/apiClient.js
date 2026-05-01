import Flight from './models/Flight.js';
import Weather from './models/Weather.js';

const BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api';

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

export async function fetchFlight(flightNumber, opts) {
  const json = await request(`/flights/${encodeURIComponent(flightNumber)}`, opts);
  return Flight.fromApi(json);
}

export async function fetchFlightDetails(flightNumber, opts) {
  const json = await request(`/flights/${encodeURIComponent(flightNumber)}/details`, opts);
  return Flight.fromApi(json);
}

export async function fetchLastFlight(flightNumber, opts) {
  const json = await request(`/flights/${encodeURIComponent(flightNumber)}/last`, opts);
  return Flight.fromApi(json);
}

export async function searchFlights(query, opts) {
  const json = await request(`/flights/search?q=${encodeURIComponent(query)}`, opts);
  return (json ?? []).map(Flight.fromApi);
}

export async function fetchWeather({ lat, lon }, opts) {
  const json = await request(`/weather?lat=${lat}&lon=${lon}`, opts);
  return Weather.fromApi(json);
}

export async function createShareLink(flightNumber, opts = {}) {
  const { sharedBy, ...fetchOpts } = opts;
  return request('/share', {
    method: 'POST',
    body: { flightNumber, sharedBy },
    ...fetchOpts,
  });
}

export async function fetchSharedFlight(shareId, opts) {
  const json = await request(`/share/${encodeURIComponent(shareId)}`, opts);
  return {
    flight:   Flight.fromApi(json.flight),
    sharedBy: json.sharedBy ?? null,
  };
}
