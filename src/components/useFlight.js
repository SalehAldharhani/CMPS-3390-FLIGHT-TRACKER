import { useEffect, useState, useCallback } from 'react';
import { fetchFlight, fetchFlightDetails, fetchLastFlight } from '../apiClient.js';

/**
 * useFlight — fetch a single flight by number with loading/error state.
 *
 * Demonstrates spec requirement:
 *   "State-handling with asynchronous functions (callbacks vs promises vs async/await)"
 *
 * BASIC FLOW:
 *   On mount we fetch from either /flights/:n (cheap, live only) or
 *   /flights/:n/details (live + summary, 2 credits) depending on the
 *   `detailed` option.
 *
 * FALLBACK FLOW (when offerFallback === true):
 *   If the initial fetch returns 404 (flight not currently airborne) AND
 *   the caller asked for the fallback, the hook does NOT auto-fetch the
 *   historical leg. Instead it sets `needsConfirmation = true` and waits.
 *   The component renders a confirmation prompt; when the user clicks
 *   "Yes, show last flight," they call `confirmFallback()` which fires
 *   the second request to /flights/:n/last.
 *
 *   This avoids spending the extra credit unless the user actively wants
 *   the historical view.
 *
 * @param {string} flightNumber
 * @param {object} options
 * @param {number}  [options.pollMs]         — refetch on this interval (rarely used now)
 * @param {boolean} [options.detailed]       — call /details (live + summary)
 * @param {boolean} [options.offerFallback]  — on 404, prompt for historical lookup
 * @returns {{
 *   flight: Flight|null,
 *   loading: boolean,
 *   error: Error|null,
 *   refetch: () => void,
 *   needsConfirmation: boolean,
 *   confirmFallback: () => void,
 *   declineFallback: () => void,
 * }}
 */
export default function useFlight(flightNumber, options = {}) {
  const { pollMs, detailed = false, offerFallback = false } = options;

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [tick, setTick] = useState(0); // bump to force a refetch

  // The initial / live fetch
  useEffect(() => {
    if (!flightNumber) { setLoading(false); return; }

    const ctrl = new AbortController();
    let timer;
    const fetcher = detailed ? fetchFlightDetails : fetchFlight;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        setNeedsConfirmation(false);
        const f = await fetcher(flightNumber, { signal: ctrl.signal });
        setFlight(f);
      } catch (err) {
        if (err.name === 'AbortError') return;

        // 404 means "not currently airborne." If the caller wants the
        // fallback, switch to confirmation state instead of erroring.
        if (offerFallback && err.status === 404) {
          setFlight(null);
          setNeedsConfirmation(true);
        } else {
          setError(err);
        }
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
  }, [flightNumber, pollMs, detailed, offerFallback, tick]);

  // User confirmed — fetch the historical leg
  const confirmFallback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setNeedsConfirmation(false);
      const f = await fetchLastFlight(flightNumber);
      setFlight(f);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [flightNumber]);

  const declineFallback = useCallback(() => {
    setNeedsConfirmation(false);
    setError(new Error(`Flight ${flightNumber} is not currently airborne.`));
  }, [flightNumber]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return {
    flight,
    loading,
    error,
    refetch,
    needsConfirmation,
    confirmFallback,
    declineFallback,
  };
}
