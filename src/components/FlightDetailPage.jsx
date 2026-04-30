import { useParams, Link } from 'react-router-dom';
import useFlight from './useFlight.js';
import { useFlights } from './FlightContext.jsx';
import FlightMap from './FlightMap.jsx';
import WeatherPanel from './WeatherPanel.jsx';
import ShareLinkButton from './ShareLinkButton.jsx';

export default function FlightDetailPage() {
  const { flightNumber } = useParams();
  const {
    flight, loading, error, refetch,
    needsConfirmation, confirmFallback, declineFallback,
  } = useFlight(flightNumber, {
    // No auto-polling — single fetch on mount. Use the Refresh button to
    // force an update. Saves FR24 credits and avoids 429s during the demo.
    detailed: true,        // hit /details for departure time + runway info
    offerFallback: true,   // if not airborne, prompt to show last leg
  });
  const { isTracked, trackFlight, untrackFlight } = useFlights();

  if (loading && !flight) {
    return <div className="ft-detail__msg">Loading flight {flightNumber}…</div>;
  }

  if (needsConfirmation) {
    return (
      <div className="ft-detail__msg ft-detail__msg--prompt">
        <h2>This flight isn't currently airborne</h2>
        <p>
          Flight <strong className="mono">{flightNumber}</strong> isn't being
          tracked live right now. Would you like to see its last completed leg
          instead?
        </p>
        <p className="ft-detail__msg-meta">
          (Looks up the most recent flight in the past 24 hours. Costs one extra credit.)
        </p>
        <div className="ft-detail__msg-actions">
          <button
            className="ft-detail__btn ft-detail__btn--primary"
            onClick={confirmFallback}
          >
            Yes, show last flight
          </button>
          <button className="ft-detail__btn" onClick={declineFallback}>
            No thanks
          </button>
        </div>
        <Link to="/" className="ft-detail__msg-back">← Back to search</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ft-detail__msg ft-detail__msg--error">
        <h2>Flight not found</h2>
        <p>{error.message}</p>
        <button onClick={refetch}>Try again</button>
        <Link to="/">← Back to search</Link>
      </div>
    );
  }

  if (!flight) return null;

  const tracked = isTracked(flight.flightNumber);

  return (
    <div className="ft-detail">
      <header className="ft-detail__head">
        <div>
          <p className="ft-detail__eyebrow mono">
            {flight.airline}
            {flight.isHistorical && (
              <span className="ft-detail__historical-badge">Last flight</span>
            )}
          </p>
          <h1 className="ft-detail__num mono">{flight.flightNumber}</h1>
          <p className="ft-detail__route">
            <strong>{flight.origin?.iata}</strong>
            <span className="ft-detail__arrow">→</span>
            <strong>{flight.destination?.iata}</strong>
            <span className="ft-detail__cities">
              {flight.origin?.city} to {flight.destination?.city}
            </span>
          </p>
        </div>

        <div className="ft-detail__actions">
          <span className={`ft-detail__status ft-detail__status--${flight.statusToken}`}>
            {flight.statusLabel}
          </span>
          <button
            className="ft-detail__btn"
            onClick={refetch}
            disabled={loading}
            aria-label="Refresh flight data"
            title="Fetch the latest position and weather"
          >
            {loading ? '…' : '↻ Refresh'}
          </button>
          <ShareLinkButton flightNumber={flight.flightNumber} />
          {tracked ? (
            <button className="ft-detail__btn" onClick={() => untrackFlight(flight.flightNumber)}>
              Untrack
            </button>
          ) : (
            <button className="ft-detail__btn ft-detail__btn--primary"
                    onClick={() => trackFlight(flight.flightNumber)}>
              Track this flight
            </button>
          )}
        </div>
      </header>

      <FlightMap flight={flight} />

      <section className="ft-detail__grid">
        <InfoTile label="Departure" lines={[
          flight.departure?.actual    && `Off ${formatTime(flight.departure.actual)}`,
          flight.departure?.scheduled && `Sched ${formatTime(flight.departure.scheduled)}`,
          flight.departure?.runway    && `Rwy ${flight.departure.runway}`,
          flight.departure?.gate      && `Gate ${flight.departure.gate}`,
        ]} />
        <InfoTile label="Arrival" lines={[
          flight.arrival?.estimated && `Est ${formatTime(flight.arrival.estimated)}`,
          flight.arrival?.scheduled && `Sched ${formatTime(flight.arrival.scheduled)}`,
          flight.arrival?.runway    && `Rwy ${flight.arrival.runway}`,
          flight.arrival?.gate      && `Gate ${flight.arrival.gate}`,
        ]} />
        <InfoTile label="Aircraft" lines={[
          flight.aircraft?.model,
          flight.aircraft?.registration && `Reg ${flight.aircraft.registration}`,
        ]} />
        <InfoTile label="Position" lines={
          (!flight.position || flight.isOnGround)
            ? ['On the ground']
            : [`Alt ${flight.position.altitude} ft`,
               `Spd ${flight.position.groundSpeed} kts`,
               `Hdg ${flight.position.heading}°`]
        } />
      </section>

      <WeatherPanel flight={flight} />
    </div>
  );
}

function InfoTile({ label, lines = [] }) {
  const items = lines.filter(Boolean);
  return (
    <div className="ft-tile">
      <span className="ft-tile__label">{label}</span>
      <ul>
        {items.length === 0
          ? <li className="ft-tile__empty">—</li>
          : items.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}
