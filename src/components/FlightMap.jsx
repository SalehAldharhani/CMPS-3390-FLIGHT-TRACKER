import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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

    const routeCoords = greatCircle([o.lon, o.lat], [d.lon, d.lat], 64);

    markersRef.current.origin?.remove();
    markersRef.current.origin = new maplibregl.Marker({
      element: makeDotElement('#60a5fa', o.iata),
      anchor: 'center',
    })
      .setLngLat([o.lon, o.lat])
      .setPopup(new maplibregl.Popup({ offset: 16 }).setText(`${o.iata} — ${o.city}`))
      .addTo(map);

    markersRef.current.dest?.remove();
    markersRef.current.dest = new maplibregl.Marker({
      element: makeDotElement('#4ade80', d.iata),
      anchor: 'center',
    })
      .setLngLat([d.lon, d.lat])
      .setPopup(new maplibregl.Popup({ offset: 16 }).setText(`${d.iata} — ${d.city}`))
      .addTo(map);

    map.getSource('route')?.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: routeCoords },
    });

    markersRef.current.plane?.remove();
    markersRef.current.plane = null;
    let snappedPlane = null;
    if (flight.position) {
      const snap = closestPointOnPath(
        [flight.position.lon, flight.position.lat],
        routeCoords
      );
      snappedPlane = snap.point;

      const nextIdx = Math.min(snap.index + 1, routeCoords.length - 1);
      const routeHeading = (snap.index < routeCoords.length - 1)
        ? bearing(snappedPlane, routeCoords[nextIdx])
        : (flight.position.heading ?? 0);

      markersRef.current.plane = new maplibregl.Marker({
        element: makePlaneElement(routeHeading),
        anchor: 'center',
      })
        .setLngLat(snappedPlane)
        .setPopup(new maplibregl.Popup({ offset: 18 }).setText(
          `${flight.flightNumber} • ${flight.position.altitude ?? '?'} ft • ${flight.position.groundSpeed ?? '?'} kts`
        ))
        .addTo(map);
    }

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
  el.innerHTML = `
    <svg viewBox="0 0 24 24" width="36" height="36"
         style="display:block;transform:rotate(${headingDeg}deg);transition:transform 300ms ease-out;"
         aria-hidden="true">
      <path fill="currentColor"
            d="M12 2 C11.2 2 10.5 2.7 10.5 3.5 L10.5 10 L3 14.5 L3 16.5 L10.5 14 L10.5 20.5 L8 21.5 L8 23 L12 22 L16 23 L16 21.5 L13.5 20.5 L13.5 14 L21 16.5 L21 14.5 L13.5 10 L13.5 3.5 C13.5 2.7 12.8 2 12 2 Z"/>
    </svg>
  `;
  return el;
}

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

    if (prevLon !== null) {
      while (lon - prevLon >  180) lon -= 360;
      while (lon - prevLon < -180) lon += 360;
    }
    prevLon = lon;

    points.push([lon, lat]);
  }
  return points;
}

function closestPointOnPath([lon, lat], path) {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    const dLon = p[0] - lon;
    const dLat = p[1] - lat;
    const d = dLon * dLon + dLat * dLat;
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  return { point: path[bestIdx], index: bestIdx };
}

function bearing([lon1, lat1], [lon2, lat2]) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
