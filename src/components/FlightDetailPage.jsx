import { useParams, Link } from 'react-router-dom';
import useFlight from './useFlight.js';
import { useFlights } from './FlightContext.jsx';
import FlightMap from './FlightMap.jsx';
import WeatherPanel from './WeatherPanel.jsx';
import ShareLinkButton from './ShareLinkButton.jsx';

export default function FlightDetailPage() {
  const { flightNumber } = useParams();
  const { flight, loading, error, refetch } = useFlight(flightNumber, { pollMs: 30_000 });
  const { isTracked, trackFlight, untrackFlight } = useFlights();

  if (loading && !flight) {
    return <div className="ft-detail__msg">Loading flight {flightNumber}…</div>;
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
          <p className="ft-detail__eyebrow mono">{flight.airline}</p>
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
          flight.departure?.scheduled && `Sched ${formatTime(flight.departure.scheduled)}`,
          flight.departure?.actual    && `Act ${formatTime(flight.departure.actual)}`,
          flight.departure?.gate      && `Gate ${flight.departure.gate}`,
        ]} />
        <InfoTile label="Arrival" lines={[
          flight.arrival?.scheduled && `Sched ${formatTime(flight.arrival.scheduled)}`,
          flight.arrival?.estimated && `Est ${formatTime(flight.arrival.estimated)}`,
          flight.arrival?.gate      && `Gate ${flight.arrival.gate}`,
        ]} />
        <InfoTile label="Aircraft" lines={[
          flight.aircraft?.model,
          flight.aircraft?.registration && `Reg ${flight.aircraft.registration}`,
        ]} />
        <InfoTile label="Position" lines={
          flight.position
            ? [`Alt ${flight.position.altitude} ft`,
               `Spd ${flight.position.groundSpeed} kts`,
               `Hdg ${flight.position.heading}°`]
            : ['On the ground']
        } />
      </section>

      <WeatherPanel flight={flight} />
    </div>
  );
}

function InfoTile({ label, lines = [] }) {
  return (
    <div className="ft-tile">
      <span className="ft-tile__label">{label}</span>
      <ul>
        {lines.filter(Boolean).map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}
