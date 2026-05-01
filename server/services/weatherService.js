const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

function describeWeatherCode(code) {
  const map = {
    0:  'Clear',
    1:  'Mainly clear',
    2:  'Partly cloudy',
    3:  'Overcast',
    45: 'Fog',
    48: 'Freezing fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    56: 'Freezing drizzle',
    57: 'Heavy freezing drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Rain showers',
    81: 'Heavy rain showers',
    82: 'Violent rain showers',
    85: 'Snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Severe thunderstorm with hail',
  };
  return map[code] ?? 'Unknown';
}

function degreesToCompass(deg) {
  if (deg === null || deg === undefined) return '';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

function weatherCodeToIcon(code) {
  if (code === 0)                    return 'clear';
  if (code === 1 || code === 2)      return 'partly-cloudy';
  if (code === 3)                    return 'overcast';
  if (code === 45 || code === 48)    return 'fog';
  if (code >= 51 && code <= 67)      return 'rain';
  if (code >= 71 && code <= 77)      return 'snow';
  if (code >= 80 && code <= 82)      return 'showers';
  if (code === 85 || code === 86)    return 'snow-showers';
  if (code >= 95)                    return 'thunderstorm';
  return 'unknown';
}

export async function fetchWeatherFromProvider({ lat, lon }) {
  const params = new URLSearchParams({
    latitude:        String(lat),
    longitude:       String(lon),
    current:         'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,visibility',
    wind_speed_unit: 'kmh',
    timezone:        'auto',
  });

  const url = `${OPEN_METEO_BASE}?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Open-Meteo HTTP error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const c = json.current ?? {};

  const tempC = c.temperature_2m;
  const code  = c.weather_code;

  const visibilityKm = c.visibility != null
    ? Math.round((c.visibility / 1000) * 10) / 10
    : null;

  return {
    location:        `${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)}`,

    tempC:           tempC,
    tempF:           tempC != null ? Math.round(tempC * 9 / 5 + 32) : null,

    condition:       describeWeatherCode(code),
    icon:            weatherCodeToIcon(code),

    windKph:         c.wind_speed_10m ?? 0,
    windDirection:   degreesToCompass(c.wind_direction_10m),
    visibilityKm:    visibilityKm ?? 0,
    precipitationMm: c.precipitation ?? 0,

    updatedAt:       new Date().toISOString(),
  };
}
