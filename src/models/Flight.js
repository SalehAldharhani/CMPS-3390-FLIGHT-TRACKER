export default class Flight {
  constructor(raw) {
    this.raw = raw ?? {};
    Object.assign(this, raw);
  }

  get id() { return this.flightNumber; }

  get displayName() {
    return `${this.airline ?? 'Unknown'} ${this.flightNumber ?? ''}`.trim();
  }

  get isEnRoute()   { return this.status === 'EN_ROUTE' && !this.isOnGround; }
  get isLanded()    { return this.status === 'LANDED'; }
  get isCancelled() { return this.status === 'CANCELLED'; }
  get isDelayed()   { return this.status === 'DELAYED'; }

  get isOnGround() {
    if (!this.position) return false;
    return (this.position.altitude ?? 0) === 0
        && (this.position.groundSpeed ?? 0) === 0;
  }

  get statusToken() {
    if (this.isOnGround) return 'board';
    switch (this.status) {
      case 'CANCELLED': return 'cancel';
      case 'DELAYED':   return 'delay';
      case 'EN_ROUTE':
      case 'LANDED':    return 'ontime';
      default:          return 'board';
    }
  }

  get statusLabel() {
    if (this.isOnGround) return 'On the ground';
    const map = {
      EN_ROUTE: 'En route',
      SCHEDULED: 'Scheduled',
      LANDED: 'Landed',
      CANCELLED: 'Cancelled',
      DELAYED: 'Delayed',
    };
    return map[this.status] ?? 'Unknown';
  }

  get delayMinutes() {
    const sched = this.arrival?.scheduled;
    const est = this.arrival?.estimated ?? this.arrival?.scheduled;
    if (!sched || !est) return 0;
    return Math.round((new Date(est) - new Date(sched)) / 60000);
  }

  get progressPercent() {
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

    const dep = this.departure?.actual ?? this.departure?.scheduled;
    const arr = this.arrival?.estimated ?? this.arrival?.scheduled;
    if (!dep || !arr) return 0;
    const total = new Date(arr) - new Date(dep);
    const elapsed = Date.now() - new Date(dep);
    if (total <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  }

  get routeLabel() {
    const o = this.origin?.iata ?? '???';
    const d = this.destination?.iata ?? '???';
    return `${o} → ${d}`;
  }

  toJSON() { return { ...this.raw }; }

  static fromApi(json) { return new Flight(json); }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
