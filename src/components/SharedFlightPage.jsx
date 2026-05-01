import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSharedFlight } from '../apiClient.js';
import FlightMap from './FlightMap.jsx';

export default function SharedFlightPage() {
  const { shareId } = useParams();
  const [flight, setFlight]     = useState(null);
  const [sharedBy, setSharedBy] = useState(null);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const result = await fetchSharedFlight(shareId, { signal: ctrl.signal });
        setFlight(result.flight);
        setSharedBy(result.sharedBy);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err);
      }
    })();
    return () => ctrl.abort();
  }, [shareId]);

  if (error) {
    return (
      <div className="ft-shared">
        <p className="ft-shared__error">That share link doesn't seem to work.</p>
        <Link to="/" className="ft-shared__cta">Track your own flights →</Link>
      </div>
    );
  }
  if (!flight) {
    return <p className="ft-shared__loading">Loading shared flight…</p>;
  }

  return (
    <div className="ft-shared">
      <header className="ft-shared__hero">
        <p className="ft-shared__eyebrow mono">Shared flight</p>

        <h1 className="ft-shared__headline">
          {buildHeadline(flight, sharedBy)}
        </h1>

        <p className="ft-shared__sub">
          <span className="mono">{flight.flightNumber}</span>
          {' · '}
          <span>{flight.origin?.city ?? flight.origin?.iata}</span>
          {' → '}
          <span>{flight.destination?.city ?? flight.destination?.iata}</span>
          {' · '}
          <span className={`ft-shared__status ft-shared__status--${flight.statusToken}`}>
            {flight.statusLabel}
          </span>
        </p>

        <div className="ft-shared__times">
          <div>
            <span className="ft-shared__times-label mono">Departed</span>
            <span className="ft-shared__times-value">
              {flight.departure?.actual
                ? formatTime(flight.departure.actual)
                : '—'}
            </span>
            {flight.departure?.runway && (
              <span className="ft-shared__times-meta mono">
                Rwy {flight.departure.runway}
              </span>
            )}
          </div>
          <div className="ft-shared__times-arrow" aria-hidden="true">→</div>
          <div>
            <span className="ft-shared__times-label mono">Arriving</span>
            <span className="ft-shared__times-value">
              {flight.arrival?.estimated
                ? formatTime(flight.arrival.estimated)
                : '—'}
            </span>
            {flight.arrival?.runway && (
              <span className="ft-shared__times-meta mono">
                Rwy {flight.arrival.runway}
              </span>
            )}
          </div>
        </div>
      </header>

      <FlightMap flight={flight} />

      <p className="ft-shared__cta-row">
        <Link to="/" className="ft-shared__cta">Track your own flights →</Link>
      </p>
    </div>
  );
}

function buildHeadline(flight, sharedBy) {
  const dest = flight.destination?.city ?? flight.destination?.iata ?? 'their destination';
  const arrival = flight.arrival?.estimated;

  if (sharedBy && arrival) {
    return `${sharedBy} will arrive in ${dest} at ${formatTime(arrival)}`;
  }
  if (sharedBy) {
    return `${sharedBy}'s flight to ${dest}`;
  }
  if (arrival) {
    return `Arriving in ${dest} around ${formatTime(arrival)}`;
  }
  return `Live flight to ${dest}`;
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}
