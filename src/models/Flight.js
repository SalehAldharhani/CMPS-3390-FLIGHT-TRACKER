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

  /** Rough percentage of the flight completed (0-100). Naive: time-based. */
  get progressPercent() {
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
