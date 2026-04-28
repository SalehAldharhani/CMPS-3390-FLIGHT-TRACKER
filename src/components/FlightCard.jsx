import { Link } from 'react-router-dom';
import useFlight from './useFlight.js';
import { useFlights } from './FlightContext.jsx';

/**
 * FlightCard - compact summary tile shown in the tracked-flights list.
 *
 * Receives only a flight number (string); fetches its own data so the list
 * page doesn't have to coordinate N parallel requests in one effect.
 */
export default function FlightCard({ flightNumber }) {
  const { flight, loading, error } = useFlight(flightNumber, { pollMs: 60_000 });
  const { untrackFlight } = useFlights();

  if (loading && !flight) {
    return (
      <div className="ft-card ft-card--skeleton" aria-busy="true">
        <div className="ft-card__shimmer" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ft-card ft-card--error">
        <div>
          <strong className="mono">{flightNumber}</strong>
          <p>Couldn't load this flight. {error.message}</p>
        </div>
        <button onClick={() => untrackFlight(flightNumber)}>Remove</button>
      </div>
    );
  }

  if (!flight) return null;

  return (
    <article className={`ft-card ft-card--${flight.statusToken}`}>
      <header className="ft-card__top">
        <span className="ft-card__num mono">{flight.flightNumber}</span>
        <span className={`ft-card__status ft-card__status--${flight.statusToken}`}>
          {flight.statusLabel}
        </span>
      </header>

      <h3 className="ft-card__route">{flight.routeLabel}</h3>
      <p className="ft-card__cities">
        {flight.origin?.city} → {flight.destination?.city}
      </p>

      {flight.isEnRoute && (
        <div className="ft-card__progress" aria-label={`Progress ${flight.progressPercent}%`}>
          <div
            className="ft-card__progress-bar"
            style={{ width: `${flight.progressPercent}%` }}
          />
        </div>
      )}

      <footer className="ft-card__actions">
        <Link to={`/flight/${flight.flightNumber}`} className="ft-card__link">
          View details →
        </Link>
        <button
          className="ft-card__remove"
          onClick={() => untrackFlight(flightNumber)}
          aria-label={`Stop tracking ${flightNumber}`}
        >
          Untrack
        </button>
      </footer>
    </article>
  );
}
