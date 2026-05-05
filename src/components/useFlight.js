import { useEffect, useState, useCallback } from "react";
import {
  fetchFlight,
  fetchFlightDetails,
  fetchLastFlight,
} from "../apiClient.js";

export default function useFlight(flightNumber, options = {}) {
  const { pollMs, detailed = false, offerFallback = false } = options;

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingLast, setPendingLast] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!flightNumber) {
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    let timer;
    const fetcher = detailed ? fetchFlightDetails : fetchFlight;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        setNeedsConfirmation(false);
        setPendingLast(null);
        const f = await fetcher(flightNumber, { signal: ctrl.signal });
        setFlight(f);
      } catch (err) {
        if (err.name === "AbortError") return;

        if (offerFallback && err.status === 404) {
          try {
            const last = await fetchLastFlight(flightNumber, {
              signal: ctrl.signal,
            });
            // Flight exists but isn't airborne right now — offer the prompt
            setPendingLast(last);
            setNeedsConfirmation(true);
          } catch (lastErr) {
            if (lastErr.name === "AbortError") return;

            setError(new Error(`No flight found with number ${flightNumber}.`));
          }
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

  const confirmFallback = useCallback(() => {
    setFlight(pendingLast);
    setNeedsConfirmation(false);
    setPendingLast(null);
  }, [pendingLast]);

  const declineFallback = useCallback(() => {
    setNeedsConfirmation(false);
    setPendingLast(null);
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
