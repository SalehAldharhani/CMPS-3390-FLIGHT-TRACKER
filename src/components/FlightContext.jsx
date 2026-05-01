import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';

const FlightContext = createContext(null);

function storageKey(username) {
  return `ft.trackedFlights.v2.${username}`;
}

function loadFromStorage(username) {
  if (!username) return [];
  try {
    const raw = localStorage.getItem(storageKey(username));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(x => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveToStorage(username, list) {
  if (!username) return;
  try { localStorage.setItem(storageKey(username), JSON.stringify(list)); }
  catch { /* quota / private mode - ignore */ }
}

export function FlightProvider({ children }) {
  const { currentUser } = useAuth();
  const [trackedFlightNumbers, setTrackedFlightNumbers] = useState(() =>
    loadFromStorage(currentUser)
  );

  useEffect(() => {
    setTrackedFlightNumbers(loadFromStorage(currentUser));
  }, [currentUser]);

  useEffect(() => {
    saveToStorage(currentUser, trackedFlightNumbers);
  }, [currentUser, trackedFlightNumbers]);

  const trackFlight = useCallback((flightNumber) => {
    if (!currentUser) return;
    setTrackedFlightNumbers(prev =>
      prev.includes(flightNumber) ? prev : [...prev, flightNumber]
    );
  }, [currentUser]);

  const untrackFlight = useCallback((flightNumber) => {
    if (!currentUser) return;
    setTrackedFlightNumbers(prev => prev.filter(n => n !== flightNumber));
  }, [currentUser]);

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
