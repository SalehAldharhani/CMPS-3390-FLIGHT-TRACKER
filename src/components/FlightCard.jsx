import { Link } from 'react-router-dom';
import useFlight from './useFlight.js';
import { useFlights } from './FlightContext.jsx';

/**
 * FlightCard - compact summary tile shown in the tracked-flights list.
 */
export default function FlightCard({ flightNumber }) {
  // Fetch once on mount.
  const { flight, loading, error, refetch } = useFlight(flightNumber);
  const { untrackFlight } = useFlights();

  if (loading && !flight) {
    return (
      <div className="ft-card ft-card--skeleton" aria-busy="true">
        <div className="ft-card__shimmer" />
      </div>
    );
  }

  if (error) {
    // Special-case 404: the flight isn't currently airborne. Don't show this
    if (error.status === 404) {
      return (
        <div className="ft-card ft-card--idle">
          <header className="ft-card__top">
            <span className="ft-card__num mono">{flightNumber}</span>
            <span className="ft-card__status ft-card__status--board">Not in the air</span>
          </header>
          <p className="ft-card__idle-msg">
            This flight isn't currently being tracked live. Click below to see
            its last completed leg.
          </p>
          <footer className="ft-card__actions">
            <Link to={`/flight/${flightNumber}`} className="ft-card__link">
              View last flight →
            </Link>
            <button
              className="ft-card__refresh"
              onClick={refetch}
              disabled={loading}
              aria-label={`Refresh ${flightNumber}`}
              title="Check if it's airborne now"
            >
              {loading ? '…' : '↻'}
            </button>
            <button
              className="ft-card__remove"
              onClick={() => untrackFlight(flightNumber)}
            >
              Untrack
            </button>
          </footer>
        </div>
      );
    }

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
          className="ft-card__refresh"
          onClick={refetch}
          disabled={loading}
          aria-label={`Refresh ${flightNumber}`}
          title="Fetch the latest position"
        >
          {loading ? '…' : '↻'}
        </button>
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
