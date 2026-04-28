/**
 * Weather - client-side data model class
 * --------------------------------------------------------------------------
 * Wraps a raw weather payload from /api/weather?lat=..&lon=..
 *
 * SHAPE OF RAW DATA (contract with backend):
 * {
 *   location: "JFK",
 *   tempC: 18,
 *   tempF: 64,
 *   condition: "Partly Cloudy",
 *   icon: "partly-cloudy",
 *   windKph: 22,
 *   windDirection: "NW",
 *   visibilityKm: 16,
 *   precipitationMm: 0,
 *   updatedAt: ISO,
 * }
 */
export default class Weather {
  constructor(raw) {
    this.raw = raw ?? {};
    Object.assign(this, raw);
  }

  /** Crude flight-impact severity: 'clear' | 'caution' | 'severe' */
  get flightImpact() {
    if (this.windKph >= 60 || this.visibilityKm < 2) return 'severe';
    if (this.windKph >= 35 || this.visibilityKm < 8) return 'caution';
    return 'clear';
  }

  get tempDisplay() {
    return `${Math.round(this.tempC ?? 0)}°C / ${Math.round(this.tempF ?? 0)}°F`;
  }

  toJSON() { return { ...this.raw }; }
  static fromApi(json) { return new Weather(json); }
}
