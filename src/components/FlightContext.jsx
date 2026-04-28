import { createContext, useContext, useEffect, useState, useCallback } from 'react';

/**
 * FlightContext
 * --------------------------------------------------------------------------
 * Holds the list of flights the user is tracking. Persists to localStorage
 * so refreshes / re-opens of the PWA keep the list intact.
 *
 * Implements spec requirements:
 *   - "Persistent Data Storage (either locally or behind an API)"
 *   - State management without prop-drilling
 *
 * The shape stored is just an array of flight numbers (strings). The actual
 * live flight data is fetched on demand from /api/flights/:flightNumber.
 */

const STORAGE_KEY = 'ft.trackedFlights.v1';
const FlightContext = createContext(null);

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(x => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveToStorage(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
  catch { /* quota / private mode - ignore */ }
}

export function FlightProvider({ children }) {
  const [trackedFlightNumbers, setTrackedFlightNumbers] = useState(loadFromStorage);

  useEffect(() => { saveToStorage(trackedFlightNumbers); }, [trackedFlightNumbers]);

  const trackFlight = useCallback((flightNumber) => {
    setTrackedFlightNumbers(prev =>
      prev.includes(flightNumber) ? prev : [...prev, flightNumber]
    );
  }, []);

  const untrackFlight = useCallback((flightNumber) => {
    setTrackedFlightNumbers(prev => prev.filter(n => n !== flightNumber));
  }, []);

  const isTracked = useCallback(
    (flightNumber) => trackedFlightNumbers.includes(flightNumber),
    [trackedFlightNumbers]
  );

  const value = { trackedFlightNumbers, trackFlight, untrackFlight, isTracked };
  return <FlightContext.Provider value={value}>{children}</FlightContext.Provider>;
}

export function useFlights() {
  const ctx = useContext(FlightContext);
  if (!ctx) throw new Error('useFlights must be used inside <FlightProvider>');
  return ctx;
}
