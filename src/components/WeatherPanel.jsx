import { useEffect, useState } from "react";
import { fetchWeather } from "../apiClient.js";

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
          fetchWeather(
            { lat: flight.origin.lat, lon: flight.origin.lon },
            { signal: ctrl.signal },
          ),
          fetchWeather(
            { lat: flight.destination.lat, lon: flight.destination.lon },
            { signal: ctrl.signal },
          ),
        ]);
        setOrigin(o);
        setDest(d);
      } catch (err) {
        if (err.name !== "AbortError") setError(err);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [flight]);

  if (loading)
    return (
      <div className="ft-weather ft-weather--loading">Loading weather…</div>
    );
  if (error)
    return (
      <div className="ft-weather ft-weather--error">Weather unavailable</div>
    );

  return (
    <section
      className="ft-weather"
      aria-label="Weather at origin and destination"
    >
      <WeatherCard
        title={`${flight.origin.iata} • Departure`}
        weather={origin}
      />
      <WeatherCard
        title={`${flight.destination.iata} • Arrival`}
        weather={dest}
      />
    </section>
  );
}

function conditionType(condition = "", isDay = true) {
  const c = condition.toLowerCase();
  if (c.includes("thunder") || c.includes("storm")) return "storm";
  if (c.includes("snow") || c.includes("sleet") || c.includes("blizzard"))
    return "snow";
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower"))
    return "rain";
  if (c.includes("fog") || c.includes("mist") || c.includes("haze"))
    return "fog";
  if (c.includes("overcast")) return "overcast";
  if (c.includes("cloud") || c.includes("partly") || c.includes("scattered"))
    return "cloudy";
  return isDay ? "clear" : "clear-night";
}

const BG_CLASS = {
  clear: "ft-weather__card--bg-clear",
  "clear-night": "ft-weather__card--bg-clear-night",
  cloudy: "ft-weather__card--bg-cloudy",
  overcast: "ft-weather__card--bg-overcast",
  rain: "ft-weather__card--bg-rain",
  storm: "ft-weather__card--bg-storm",
  snow: "ft-weather__card--bg-snow",
  fog: "ft-weather__card--bg-fog",
};

function WeatherIcon({ type }) {
  switch (type) {
    case "clear":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="12" fill="currentColor" />
          <path
            d="M32 6v8M32 50v8M6 32h8M50 32h8M14.1 14.1l5.7 5.7M44.2 44.2l5.7 5.7M49.9 14.1l-5.7 5.7M19.8 44.2l-5.7 5.7"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "cloudy":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50 44H18a12 12 0 010-24 1 1 0 011 .1A16 16 0 0150 32a12 12 0 010 12z"
            fill="currentColor"
          />
          <path
            d="M18 32a8 8 0 010-16 1 1 0 011 .1A11 11 0 0130 24"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      );
    case "overcast":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M52 46H16a13 13 0 010-26 1 1 0 011 .1A17 17 0 0152 34a13 13 0 010 12z"
            fill="currentColor"
          />
          <path
            d="M8 26h4M52 14l-3 3M20 10l2 3"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>
      );
    case "rain":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50 36H18a12 12 0 010-24 1 1 0 011 .1A16 16 0 0150 24a12 12 0 010 12z"
            fill="currentColor"
          />
          <path
            d="M20 46l-4 12M30 46l-4 12M40 46l-4 12M50 46l-4 12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "storm":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50 34H18a12 12 0 010-24 1 1 0 011 .1A16 16 0 0150 22a12 12 0 010 12z"
            fill="currentColor"
          />
          <path
            d="M36 38l-10 14h10l-8 12"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "snow":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50 36H18a12 12 0 010-24 1 1 0 011 .1A16 16 0 0150 24a12 12 0 010 12z"
            fill="currentColor"
          />
          <path
            d="M20 52v-8M20 48h4M20 48h-4M32 52v-8M32 48h4M32 48h-4M44 52v-8M44 48h4M44 48h-4"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "fog":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 16h48M8 26h48M8 36h36M8 46h40"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "clear-night":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g fill="currentColor" fillRule="evenodd">
            <circle cx="28" cy="33" r="20" />
            <circle cx="36" cy="27" r="18" />
          </g>
          <circle cx="53" cy="11" r="2.5" fill="currentColor" />
          <circle cx="58" cy="26" r="1.5" fill="currentColor" />
          <circle cx="47" cy="5" r="2" fill="currentColor" />
          <circle cx="60" cy="18" r="1" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

function WeatherCard({ title, weather }) {
  if (!weather) return null;
  const type = conditionType(weather.condition, weather.isDay !== false);
  const bgClass = BG_CLASS[type];
  return (
    <article
      className={`ft-weather__card ft-weather__card--${weather.flightImpact} ${bgClass}`}
    >
      <div className="ft-weather__icon" aria-hidden="true">
        <WeatherIcon type={type} />
      </div>
      <h4>{title}</h4>
      <div className="ft-weather__temp">{weather.tempDisplay}</div>
      <div className="ft-weather__cond">{weather.condition}</div>
      <dl className="ft-weather__meta">
        <div>
          <dt>Wind</dt>
          <dd>
            {weather.windKph} kph {weather.windDirection}
          </dd>
        </div>
        <div>
          <dt>Visibility</dt>
          <dd>{weather.visibilityKm} km</dd>
        </div>
        <div>
          <dt>Precip</dt>
          <dd>{weather.precipitationMm} mm</dd>
        </div>
      </dl>
    </article>
  );
}
