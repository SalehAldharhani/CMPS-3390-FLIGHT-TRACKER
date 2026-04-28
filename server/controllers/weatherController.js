import { fetchWeatherFromProvider } from '../services/weatherService.js';

/** GET /api/weather?lat=&lon= */
export async function getWeather(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: 'lat and lon query params required' });
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'lat/lon out of range' });
    }

    const weather = await fetchWeatherFromProvider({ lat, lon });
    res.json(weather);
  } catch (err) {
    next(err);
  }
}
