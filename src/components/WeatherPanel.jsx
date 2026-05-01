import { useEffect, useState } from 'react';
import { fetchWeather } from '../apiClient.js';

export default function WeatherPanel({ flight }) {
  const [origin, setOrigin] = useState(null);
  const [dest, setDest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!flight?.origin || !flight?.destination) return;
    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [o, d] = await Promise.all([
          fetchWeather({ lat: flight.origin.lat, lon: flight.origin.lon }, { signal: ctrl.signal }),
          fetchWeather({ lat: flight.destination.lat, lon: flight.destination.lon }, { signal: ctrl.signal }),
        ]);
        setOrigin(o);
        setDest(d);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [flight]);

  if (loading) return <div className="ft-weather ft-weather--loading">Loading weather…</div>;
  if (error)   return <div className="ft-weather ft-weather--error">Weather unavailable</div>;

  return (
    <section className="ft-weather" aria-label="Weather at origin and destination">
      <WeatherCard title={`${flight.origin.iata} • Departure`} weather={origin} />
      <WeatherCard title={`${flight.destination.iata} • Arrival`}   weather={dest} />
    </section>
  );
}

function WeatherCard({ title, weather }) {
  if (!weather) return null;
  return (
    <article className={`ft-weather__card ft-weather__card--${weather.flightImpact}`}>
      <h4>{title}</h4>
      <div className="ft-weather__temp">{weather.tempDisplay}</div>
      <div className="ft-weather__cond">{weather.condition}</div>
      <dl className="ft-weather__meta">
        <div><dt>Wind</dt><dd>{weather.windKph} kph {weather.windDirection}</dd></div>
        <div><dt>Visibility</dt><dd>{weather.visibilityKm} km</dd></div>
        <div><dt>Precip</dt><dd>{weather.precipitationMm} mm</dd></div>
      </dl>
    </article>
  );
}
