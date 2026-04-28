/**
 * weatherService.js
 * --------------------------------------------------------------------------
 * OWNER: Clonexstax
 *
 * EXPECTED RETURN SHAPE (must match src/models/Weather.js):
 *   {
 *     location, tempC, tempF, condition, icon,
 *     windKph, windDirection, visibilityKm, precipitationMm, updatedAt
 *   }
 *
 * TODO: BACKEND
 *   - Pick a provider: OpenWeatherMap, WeatherAPI.com, Open-Meteo (free, no key).
 *   - Add WEATHER_API_KEY to .env if needed.
 *   - Replace the mock body with a real fetch and map fields into the shape above.
 *   - Add a short-lived cache keyed on rounded lat/lon to cut upstream calls.
 */

export async function fetchWeatherFromProvider({ lat, lon }) {
  // ---------- TODO: BACKEND - real API call -------------------------------
  await sleep(120);

  // Deterministic-ish mock so the same coords give the same result.
  const seed = Math.abs(Math.round(lat * 7 + lon * 13));
  const tempC = 5 + (seed % 25);
  return {
    location:        `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    tempC,
    tempF:           Math.round(tempC * 9 / 5 + 32),
    condition:       ['Clear', 'Partly Cloudy', 'Overcast', 'Light rain'][seed % 4],
    icon:            'partly-cloudy',
    windKph:         5 + (seed % 40),
    windDirection:   ['N','NE','E','SE','S','SW','W','NW'][seed % 8],
    visibilityKm:    2 + (seed % 14),
    precipitationMm: seed % 5,
    updatedAt:       new Date().toISOString(),
  };
  // -------------------------------------------------------------------------
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
