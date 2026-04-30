import { useEffect, useState } from 'react';
import { fetchFlight, fetchFlightDetails } from '../apiClient.js';

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
 * @param {object} options
 * @param {number} [options.pollMs]    - if set, refetch on this interval
 * @param {boolean} [options.detailed] - if true, hits /details (live + summary,
 *                                       2 credits per cache miss). Use ONLY on
 *                                       the detail page, not on home cards.
 * @returns {{ flight: Flight|null, loading: boolean, error: Error|null, refetch: () => void }}
 */
export default function useFlight(flightNumber, { pollMs, detailed = false } = {}) {
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0); // bump to force a refetch

  useEffect(() => {
    if (!flightNumber) { setLoading(false); return; }

    const ctrl = new AbortController();
    let timer;
    const fetcher = detailed ? fetchFlightDetails : fetchFlight;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const f = await fetcher(flightNumber, { signal: ctrl.signal });
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
  }, [flightNumber, pollMs, detailed, tick]);

  return { flight, loading, error, refetch: () => setTick(t => t + 1) };
}
