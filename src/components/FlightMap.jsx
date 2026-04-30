import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * FlightMap — globe view with origin, destination, great-circle route,
 * and the live aircraft position when airborne.
 *
 * Built with MapLibre GL JS in globe projection. The basemap style is
 * defined inline (rather than fetched from a remote style.json) so that
 * the globe projection is guaranteed to apply. Some hosted styles override
 * projection settings, which silently falls back to flat Mercator.
 *
 */

// --- Inline basemap style ------------------------------------------------
const MAP_STYLE = {
  version: 8,
  projection: { type: 'globe' },
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    },
    // Route source — lives in the style so it's ready immediately
    route: {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
    },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#0b1020' } },
    { id: 'tiles',      type: 'raster',     source: 'carto-dark' },
    {
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#ffb347',
        'line-width': 2.5,
        'line-opacity': 0.9,
        'line-dasharray': [2, 1.5],
      },
    },
  ],
  // Atmosphere glow around the edge of the globe
  sky: {
    'sky-color': '#0b1020',
    'sky-horizon-blend': 0.5,
    'horizon-color': '#1f2a4a',
    'horizon-fog-blend': 0.6,
    'fog-color': '#0b1020',
    'fog-ground-blend': 0.0,
  },
};

export default function FlightMap({ flight }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef({ origin: null, dest: null, plane: null });

  // -------------------------------------------------------------------------
  // 1. Create the map ONCE on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [0, 30],
      zoom: 1.4,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    // Defensive: re-assert globe projection once the style is loaded.
    map.on('load', () => {
      try { map.setProjection({ type: 'globe' }); } catch { /* ignore */ }
      renderFlight();
    });

    mapRef.current = map;

    return () => {
      Object.values(markersRef.current).forEach(m => m?.remove());
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // 2. When the flight changes, update markers + route + camera
  // -------------------------------------------------------------------------
  useEffect(() => {
    renderFlight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight]);

  function renderFlight() {
    const map = mapRef.current;
    if (!map || !flight?.origin || !flight?.destination) return;

    if (!map.isStyleLoaded()) {
      map.once('load', renderFlight);
      return;
    }

    const o = flight.origin;
    const d = flight.destination;

    // Compute the great-circle path FIRST so we can also use it to position
    // the plane marker on the route (instead of trusting an arbitrary
    // position that might be off-route in the mock data).
    const routeCoords = greatCircle([o.lon, o.lat], [d.lon, d.lat], 64);

    // ---- Origin marker ----
    markersRef.current.origin?.remove();
    markersRef.current.origin = new maplibregl.Marker({
      element: makeDotElement('#60a5fa', o.iata),
      anchor: 'center',
    })
      .setLngLat([o.lon, o.lat])
      .setPopup(new maplibregl.Popup({ offset: 16 }).setText(`${o.iata} — ${o.city}`))
      .addTo(map);

    // ---- Destination marker ----
    markersRef.current.dest?.remove();
    markersRef.current.dest = new maplibregl.Marker({
      element: makeDotElement('#4ade80', d.iata),
      anchor: 'center',
    })
      .setLngLat([d.lon, d.lat])
      .setPopup(new maplibregl.Popup({ offset: 16 }).setText(`${d.iata} — ${d.city}`))
      .addTo(map);

    // ---- Route line ----
    map.getSource('route')?.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: routeCoords },
    });

    // ---- Plane marker (only if airborne) ----
    markersRef.current.plane?.remove();
    markersRef.current.plane = null;
    let snappedPlane = null;
    if (flight.position) {
      // Snap the plane to the closest point on the great-circle. This
      // ensures the plane visually sits on the route line even if the
      // raw position is slightly off (real APIs do this; mock data may not).
      snappedPlane = closestPointOnPath(
        [flight.position.lon, flight.position.lat],
        routeCoords
      );

      markersRef.current.plane = new maplibregl.Marker({
        element: makePlaneElement(flight.position.heading ?? 0),
        anchor: 'center',
      })
        .setLngLat(snappedPlane)
        .setPopup(new maplibregl.Popup({ offset: 18 }).setText(
          `${flight.flightNumber} • ${flight.position.altitude ?? '?'} ft • ${flight.position.groundSpeed ?? '?'} kts`
        ))
        .addTo(map);
    }

    // ---- Fit camera to show the actual route ----
    // IMPORTANT: use the UNWRAPPED route coordinates here, not the raw
    // origin/destination longitudes. For Pacific routes (LAX↔NRT etc.),
    // the unwrapped path uses extended-range longitudes like -219° to
    // express points across the date line. If we used the raw airport
    // coordinates here, the bounding box would span the wrong half of
    // the globe and the camera would center on the back side of Earth
    // (where the route ISN'T).
    const bounds = new maplibregl.LngLatBounds();
    routeCoords.forEach((pt) => bounds.extend(pt));
    if (snappedPlane) bounds.extend(snappedPlane);
    map.fitBounds(bounds, {
      padding: { top: 60, right: 60, bottom: 60, left: 60 },
      duration: 1500,
      maxZoom: 4,
    });
  }

  return (
    <section className="ft-map" aria-label="Flight map">
      <div ref={containerRef} className="ft-map__canvas" />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Marker DOM helpers
// ---------------------------------------------------------------------------

function makeDotElement(color, label) {
  const el = document.createElement('div');
  el.className = 'ft-map-marker';
  el.innerHTML = `
    <span class="ft-map-marker__dot" style="background:${color};color:${color}"></span>
    <span class="ft-map-marker__label">${label}</span>
  `;
  return el;
}

function makePlaneElement(headingDeg) {
  const el = document.createElement('div');
  el.className = 'ft-map-plane';
  // Airplane glyph naturally points up-right (~45°). Subtract that so 0° = north.
  el.style.transform = `rotate(${headingDeg - 45}deg)`;
  el.innerHTML = '✈';
  return el;
}

// ---------------------------------------------------------------------------
// Great-circle interpolation (Slerp on the unit sphere)
// ---------------------------------------------------------------------------
// IMPORTANT: routes that cross the international date line (e.g. LAX → NRT)
// produce longitudes that wrap from -180 to +180. MapLibre would then draw
// the line going the "long way around" the globe through the wrong hemisphere.
// To prevent this, we UNWRAP longitudes as we go: if a new longitude jumps
// more than 180° from the previous one, we shift it by ±360° to keep the
// sequence continuous. The result still represents the same physical points
// — just expressed in extended-range longitude coordinates.
function greatCircle([lon1, lat1], [lon2, lat2], segments = 64) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1), λ1 = toRad(lon1);
  const φ2 = toRad(lat2), λ2 = toRad(lon2);

  const a = [Math.cos(φ1) * Math.cos(λ1), Math.cos(φ1) * Math.sin(λ1), Math.sin(φ1)];
  const b = [Math.cos(φ2) * Math.cos(λ2), Math.cos(φ2) * Math.sin(λ2), Math.sin(φ2)];

  const dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const θ = Math.acos(Math.max(-1, Math.min(1, dot)));

  if (θ < 1e-9) return [[lon1, lat1], [lon2, lat2]];

  const sinθ = Math.sin(θ);
  const points = [];
  let prevLon = null;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const A = Math.sin((1 - t) * θ) / sinθ;
    const B = Math.sin(t * θ)       / sinθ;

    const x = A * a[0] + B * b[0];
    const y = A * a[1] + B * b[1];
    const z = A * a[2] + B * b[2];

    const lat = toDeg(Math.atan2(z, Math.sqrt(x*x + y*y)));
    let lon   = toDeg(Math.atan2(y, x));

    // Unwrap: keep the longitude continuous with the previous point so that
    // MapLibre draws the line over the date line, not back around the globe.
    if (prevLon !== null) {
      while (lon - prevLon >  180) lon -= 360;
      while (lon - prevLon < -180) lon += 360;
    }
    prevLon = lon;

    points.push([lon, lat]);
  }
  return points;
}

/**
 * Given a point and a polyline, return the closest point on the polyline.
 * Used to snap the plane marker onto the route line for visual cleanliness.
 * Quick-and-dirty: just finds the nearest vertex (sufficient with 64 segments).
 */
function closestPointOnPath([lon, lat], path) {
  let best = path[0];
  let bestDist = Infinity;
  for (const p of path) {
    const dLon = p[0] - lon;
    const dLat = p[1] - lat;
    const d = dLon * dLon + dLat * dLat;
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return best;
}