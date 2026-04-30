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

//API KEYS
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_BASE_URL = 'http://api.weatherstack.com';

export async function fetchWeatherFromProvider({ lat, lon }) {
  // ---------- TODO: BACKEND - real API call -------------------------------
  if (!WEATHER_API_KEY) throw new Error('Missing WEATHER_API_KEY in .env');
    
  const params = new URLSearchParams({
    access_key: WEATHER_API_KEY,
    query:      `${lat},${lon}`,
    units:      'm', // metric – gives °C, km/h, km visibility
  });
 
  const res = await fetch(`${WEATHER_BASE_URL}/current?${params}`);
 
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Weatherstack HTTP error ${res.status}: ${body}`);
  }
 
  const json = await res.json();
 
  // Weatherstack returns { success: false, error: {...} } on API-level errors
  if (json.success === false) {
    throw new Error(
      `Weatherstack API error ${json.error?.code}: ${json.error?.info}`
    );
  }
 
  const current  = json.current;
  const location = json.location;
 
  const tempC = current.temperature;
 
  return {
    // Prefer city name from the API; fall back to raw coords
    location:        location?.name
                     ? `${location.name}, ${location.country}`
                     : `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
 
    tempC,
    tempF:           Math.round(tempC * 9 / 5 + 32),
 
    condition:       current.weather_descriptions?.[0] ?? 'Unknown',
 
    // Weatherstack gives a full icon URL, e.g. https://cdn.worldweatheronline.com/...
    icon:            current.weather_icons?.[0] ?? null,
 
    windKph:         current.wind_speed,       // already in km/h when units=m
    windDirection:   current.wind_dir,         // e.g. "NNE"
    visibilityKm:    current.visibility,       // km
    precipitationMm: current.precip,           // mm
    updatedAt:       new Date().toISOString(),
  };
}
//   // Deterministic-ish mock so the same coords give the same result.
//   const seed = Math.abs(Math.round(lat * 7 + lon * 13));
//   const tempC = 5 + (seed % 25);
//   return {
//     location:        `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
//     tempC,
//     tempF:           Math.round(tempC * 9 / 5 + 32),
//     condition:       ['Clear', 'Partly Cloudy', 'Overcast', 'Light rain'][seed % 4],
//     icon:            'partly-cloudy',
//     windKph:         5 + (seed % 40),
//     windDirection:   ['N','NE','E','SE','S','SW','W','NW'][seed % 8],
//     visibilityKm:    2 + (seed % 14),
//     precipitationMm: seed % 5,
//     updatedAt:       new Date().toISOString(),
//   };
//   // -------------------------------------------------------------------------
// }

// function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
