/**
 * Flight - client-side data model class
 * --------------------------------------------------------------------------
 * Wraps a raw flight object returned from /api/flights/:flightNumber and
 * exposes computed properties + helpers. Used by FlightCard, FlightDetail,
 * map components, etc.
 *
 * Required by spec: "Client-Side Data Model Classes"
 *
 * SHAPE OF RAW DATA (contract with backend):
 * {
 *   flightNumber: "AA100",
 *   airline:      "American Airlines",
 *   status:       "EN_ROUTE" | "SCHEDULED" | "LANDED" | "CANCELLED" | "DELAYED",
 *   origin:       { iata: "JFK", city: "New York",   lat: 40.6413, lon: -73.7781 },
 *   destination:  { iata: "LHR", city: "London",     lat: 51.4700, lon: -0.4543  },
 *   departure:    { scheduled: ISO, actual: ISO|null, gate: "B22"|null },
 *   arrival:      { scheduled: ISO, estimated: ISO|null, gate: "T5"|null },
 *   position:     { lat, lon, altitude, heading, groundSpeed }, // null if not airborne
 *   aircraft:     { model: "B777", registration: "N123AA" }
 * }
 */
export default class Flight {
  constructor(raw) {
    this.raw = raw ?? {};
    Object.assign(this, raw);
  }

  // ---- Identity -----------------------------------------------------------
  get id() { return this.flightNumber; }

  get displayName() {
    return `${this.airline ?? 'Unknown'} ${this.flightNumber ?? ''}`.trim();
  }

  // ---- Status helpers -----------------------------------------------------
  get isEnRoute()   { return this.status === 'EN_ROUTE'; }
  get isLanded()    { return this.status === 'LANDED'; }
  get isCancelled() { return this.status === 'CANCELLED'; }
  get isDelayed()   { return this.status === 'DELAYED'; }

  /** Returns one of: 'ontime' | 'delay' | 'cancel' | 'board' for CSS theming */
  get statusToken() {
    switch (this.status) {
      case 'CANCELLED': return 'cancel';
      case 'DELAYED':   return 'delay';
      case 'EN_ROUTE':
      case 'LANDED':    return 'ontime';
      default:          return 'board';
    }
  }

  get statusLabel() {
    const map = {
      EN_ROUTE: 'En route',
      SCHEDULED: 'Scheduled',
      LANDED: 'Landed',
      CANCELLED: 'Cancelled',
      DELAYED: 'Delayed',
    };
    return map[this.status] ?? 'Unknown';
  }

  // ---- Derived numbers ----------------------------------------------------

  /** Minutes between scheduled and actual/estimated arrival. */
  get delayMinutes() {
    const sched = this.arrival?.scheduled;
    const est = this.arrival?.estimated ?? this.arrival?.scheduled;
    if (!sched || !est) return 0;
    return Math.round((new Date(est) - new Date(sched)) / 60000);
  }

  /**
   * Percentage of the flight completed (0-100).
   *
   * Strategy (in order of preference):
   *   1. POSITION-BASED — if we have origin/destination coords and a current
   *      position, compute distance traveled vs. total route distance. This
   *      works for live flights even without scheduled times. Most accurate.
   *   2. TIME-BASED — if positions aren't available but departure + arrival
   *      times are, fall back to elapsed/total time.
   *   3. ZERO — if we have neither, just return 0.
   */
  get progressPercent() {
    // Try position-based first (most reliable for live flights)
    const o = this.origin;
    const d = this.destination;
    const p = this.position;
    if (o && d && p && o.lat && o.lon && d.lat && d.lon &&
        (o.lat !== 0 || o.lon !== 0) && (d.lat !== 0 || d.lon !== 0)) {
      const total = haversine(o.lat, o.lon, d.lat, d.lon);
      const traveled = haversine(o.lat, o.lon, p.lat, p.lon);
      if (total > 0) {
        return Math.max(0, Math.min(100, Math.round((traveled / total) * 100)));
      }
    }

    // Fallback to time-based
    const dep = this.departure?.actual ?? this.departure?.scheduled;
    const arr = this.arrival?.estimated ?? this.arrival?.scheduled;
    if (!dep || !arr) return 0;
    const total = new Date(arr) - new Date(dep);
    const elapsed = Date.now() - new Date(dep);
    if (total <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  }

  // ---- Routing ------------------------------------------------------------
  get routeLabel() {
    const o = this.origin?.iata ?? '???';
    const d = this.destination?.iata ?? '???';
    return `${o} → ${d}`;
  }

  // ---- Serialisation ------------------------------------------------------
  toJSON() { return { ...this.raw }; }

  static fromApi(json) { return new Flight(json); }
}

/**
 * Great-circle distance between two lat/lon points (in km).
 * Used by progressPercent to compute "how far through the route is the plane?"
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
