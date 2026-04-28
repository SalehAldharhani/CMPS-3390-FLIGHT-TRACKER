import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSharedFlight } from '../apiClient.js';
import FlightMap from './FlightMap.jsx';

/**
 * Public read-only view of a flight. Uses /api/share/:shareId so we don't
 * leak the flight number directly and so the backend can rate-limit /
 * expire the link if it wants to.
 */
export default function SharedFlightPage() {
  const { shareId } = useParams();
  const [flight, setFlight] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const f = await fetchSharedFlight(shareId, { signal: ctrl.signal });
        setFlight(f);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err);
      }
    })();
    return () => ctrl.abort();
  }, [shareId]);

  if (error)   return <p style={{ padding: '2rem' }}>That share link doesn't seem to work.</p>;
  if (!flight) return <p style={{ padding: '2rem' }}>Loading shared flight…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header>
        <p className="mono" style={{ color: 'var(--color-text-muted)' }}>Shared flight</p>
        <h1 className="mono">{flight.flightNumber}</h1>
        <p>{flight.origin?.city} → {flight.destination?.city} · {flight.statusLabel}</p>
      </header>
      <FlightMap flight={flight} />
      <p>
        <Link to="/">Track your own flights →</Link>
      </p>
    </div>
  );
}
