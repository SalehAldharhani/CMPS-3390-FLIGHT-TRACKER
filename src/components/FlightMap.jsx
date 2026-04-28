
/**
 * FlightMap
 * --------------------------------------------------------------------------
 * Placeholder for the live globe / map view of a flight.
 *
 * INTEGRATION TODO (Jon + JASD3EP):
 *   The research log mentions rnmapbox. For a React JS web app, options are:
 *     - Mapbox GL JS  (recommended, matches the rnmapbox research)
 *     - MapLibre GL JS (free fork of Mapbox)
 *     - Leaflet       (simplest, free, no token required)
 *
 *   Whichever you pick:
 *   1. npm install <library>
 *   2. Render the map inside the .ft-map__canvas div below
 *   3. Plot:
 *      - Origin marker (flight.origin.lat / .lon)
 *      - Destination marker
 *      - Great-circle line between them
 *      - Live aircraft position (flight.position) if present
 *
 * BACKEND TODO (Clonexstax):
 *   The position data comes from /api/flights/:flightNumber. Make sure the
 *   `position` object is updated frequently enough to feel live.
 */
export default function FlightMap({ flight }) {
  return (
    <section className="ft-map" aria-label="Flight map">
      <div className="ft-map__canvas">
        <div className="ft-map__placeholder">
          <span className="ft-map__icon" aria-hidden="true">🌍</span>
          <p>Map renders here</p>
          <small>
            {flight?.origin?.iata ?? '???'} → {flight?.destination?.iata ?? '???'}
          </small>
        </div>
      </div>
    </section>
  );
}
