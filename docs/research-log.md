# Research Log

| Resource | Takeaway | Time |
|---|---|---|
| ChatGPT | API definitions and architecture decisions: confirmed React + Express skeleton, mock-first development, MVC server layout. | 1:00 |
| rnmapbox | Globe / map API reading. Mapbox is React Native first; for our React JS web build the equivalent is **Mapbox GL JS** or its free fork **MapLibre GL JS**. **Leaflet** is a third option, easiest to set up. | 0:30 |
| FlightRadar24 | Flight tracking API. Commercial, has free tiers. Alternatives to evaluate: AviationStack (free tier 100 req/mo), OpenSky Network (free, anonymous, but rate-limited), aviationapi.com. | 0:30 |
| Weather APIs | Three candidates: OpenWeatherMap (popular, free tier), WeatherAPI.com (generous free tier), **Open-Meteo** (no key required, simplest to ship a demo with). | 0:30 |

## Open decisions

### Map library — pick one before sprint 1

| Option | Pros | Cons |
|---|---|---|
| Mapbox GL JS | Best-looking globe; 3D terrain; aligns with rnmapbox research | Requires API token; commercial |
| MapLibre GL JS | Free fork of Mapbox; same API | Smaller styling ecosystem |
| Leaflet | Zero-config; lightweight; many tile providers | 2D only, less "wow" |

**Recommendation:** start with MapLibre + a free tile source (CARTO or Stadia). If the polish bar isn't met, switch to Mapbox.

### Flight API — pick one before sprint 1

| Option | Free tier | Notes |
|---|---|---|
| OpenSky | Yes, anonymous | Position data only, no schedule/gate. Best for "live tracking" but lacks airline metadata. |
| AviationStack | 100 req/month | Schedule + airline data. Tight quota. |
| FlightRadar24 | Trial only | Premium quality, premium price. |

**Recommendation:** combine OpenSky (live position) with AviationStack (schedule + metadata) — backend merges them into our model shape.

### Weather API — pick one before sprint 1

| Option | Free tier | Notes |
|---|---|---|
| Open-Meteo | Unlimited, no key | Cleanest dev experience |
| OpenWeatherMap | 60 req/min | Most familiar |
| WeatherAPI.com | 1M req/month | Most generous |

**Recommendation:** Open-Meteo for ease of setup; switch later if we need richer fields.

---

## Worth revisiting later

- **PWA install UX** — what does the install prompt look like? When do we trigger it?
- **Service worker caching strategy** — cache-first for shell, network-first for `/api/*`.
- **Time zone handling** — flight times come in UTC; display in user's local zone, but show airport-local time as a secondary line. Library: `date-fns-tz` or `Intl.DateTimeFormat` with `timeZone`.
- **Color blindness pass on status colors** — the green/amber/red trio needs an icon or label backup, not just hue.
