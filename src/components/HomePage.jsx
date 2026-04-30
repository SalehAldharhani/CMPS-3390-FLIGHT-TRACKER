import FlightSearch from "./FlightSearch.jsx";
import FlightCard from "./FlightCard.jsx";
import { useFlights } from "./FlightContext.jsx";

export default function HomePage() {
  const { trackedFlightNumbers } = useFlights();

  return (
    <div className="ft-home">
      <section className="ft-home__hero">
        <h1 className="ft-home__title">Where in the world is your flight?</h1>
        <p className="ft-home__lede">
          Punch in a flight number to see live position, status, and weather at
          both airports. Share a link with whoever is waiting for you.
        </p>
        <FlightSearch />
      </section>

      <section className="ft-home__tracked">
        <header className="ft-home__tracked-head">
          <h2>Tracked flights</h2>
          <span className="ft-home__count mono">
            {trackedFlightNumbers.length} active
          </span>
        </header>

        {trackedFlightNumbers.length === 0 ? (
          <div className="ft-home__empty">
            <p>No flights tracked yet. Search above to add one.</p>
          </div>
        ) : (
          <div className="ft-home__grid">
            {trackedFlightNumbers.map((num) => (
              <FlightCard key={num} flightNumber={num} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
