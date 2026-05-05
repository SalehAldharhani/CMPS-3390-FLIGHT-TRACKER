# Research Log

## What We Looked Into

| Resource      | What We Found                                                                                                                       | Time Spent |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| ChatGPT       | Helped confirm the overall architecture — React frontend, Express backend, MVC folder structure, and building with mock data first. | 1:00       |
| Map Libraries | Looked at Mapbox GL JS, MapLibre GL JS, and Leaflet as options for showing the flight map.                                          | 0:30       |
| Flight APIs   | Looked at FlightRadar24, AviationStack, and OpenSky Network as options for live flight data.                                        | 0:30       |
| Weather APIs  | Looked at OpenWeatherMap, WeatherAPI.com, and Open-Meteo as options for airport weather.                                            | 0:30       |

---

## What We Compared

### Map Library

| Option         | Good                           | Bad                               |
| -------------- | ------------------------------ | --------------------------------- |
| Mapbox GL JS   | Best looking globe, 3D support | Needs a paid API key              |
| MapLibre GL JS | Free, same features as Mapbox  | Slightly smaller community        |
| Leaflet        | Easiest to set up, lightweight | 2D only, less impressive visually |

**What we used: MapLibre GL JS** — free, no API key needed, and looks just as good as Mapbox for our use case.

---

### Flight API

| Option          | Free Tier          | Notes                                           |
| --------------- | ------------------ | ----------------------------------------------- |
| OpenSky Network | Yes, no key        | Live position only, no airline or schedule data |
| AviationStack   | 100 requests/month | Has schedule data but the quota is too low      |
| FlightRadar24   | Trial only         | Best quality data, used by real aviation apps   |

**What we used: FlightRadar24** — best and most complete flight data including live position, airline info, and runway details.

---

### Weather API

| Option         | Free Tier                | Notes                      |
| -------------- | ------------------------ | -------------------------- |
| Open-Meteo     | Unlimited, no key needed | Easiest to set up          |
| OpenWeatherMap | 60 requests/minute       | Well known, requires a key |
| WeatherAPI.com | 1 million requests/month | Most generous free tier    |

**What we used: Open-Meteo** — completely free, no API key required, and simple to work with.

---

## Final Choices Summary

| Part         | What We Used                             |
| ------------ | ---------------------------------------- |
| Frontend     | React + Vite                             |
| Backend      | Express (Node.js)                        |
| Map          | MapLibre GL JS with ESRI satellite tiles |
| Flight Data  | FlightRadar24 API                        |
| Weather Data | Open-Meteo API (no key needed)           |
| Deployment   | Render (render.com)                      |
