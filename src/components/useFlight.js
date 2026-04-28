import { useEffect, useState } from 'react';
import { fetchFlight } from '../apiClient.js';

/**
 * useFlight - fetch a single flight by number with loading/error state.
 *
 * Demonstrates spec requirement:
 *   "State-handling with asynchronous functions (callbacks vs promises vs async/await)"
 *
 * We use async/await + AbortController so navigating away mid-fetch doesn't
 * leak a setState into an unmounted component.
 *
 * @param {string} flightNumber
 * @param {{ pollMs?: number }} options - if pollMs is set, refetch on interval
 * @returns {{ flight: Flight|null, loading: boolean, error: Error|null, refetch: () => void }}
 */
export default function useFlight(flightNumber, { pollMs } = {}) {
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0); // bump to force a refetch

  useEffect(() => {
    if (!flightNumber) { setLoading(false); return; }

    const ctrl = new AbortController();
    let timer;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const f = await fetchFlight(flightNumber, { signal: ctrl.signal });
        setFlight(f);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err);
      } finally {
        setLoading(false);
      }
    }

    load();

    if (pollMs && pollMs > 0) {
      timer = setInterval(load, pollMs);
    }

    return () => {
      ctrl.abort();
      if (timer) clearInterval(timer);
    };
  }, [flightNumber, pollMs, tick]);

  return { flight, loading, error, refetch: () => setTick(t => t + 1) };
}
