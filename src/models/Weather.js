export default class Weather {
  constructor(raw) {
    this.raw = raw ?? {};
    Object.assign(this, raw);
  }

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
