// components/RouteMap.jsx
// Azure Maps display for pinned stops.
// Fetches the subscription key from /api/maps-config so it stays server-side.
import { useEffect, useRef, useState } from 'react';

const STOP_COLORS = { prospect: '#10b981', client: '#3b82f6' };

export default function RouteMap({ stops, onStopClick }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const [mapsKey, setMapsKey]   = useState(null);
  const [keyError, setKeyError] = useState(null);

  // Fetch the key once on mount
  useEffect(() => {
    fetch('/api/maps-config')
      .then((r) => r.json())
      .then((d) => {
        if (d.key) setMapsKey(d.key);
        else setKeyError(d.error || 'Azure Maps key not configured.');
      })
      .catch(() => setKeyError('Could not reach /api/maps-config.'));
  }, []);

  // Initialize map once we have the key and the container
  useEffect(() => {
    if (!mapsKey || !containerRef.current) return;

    import('azure-maps-control').then(({ Map, data, HtmlMarker }) => {
      if (mapRef.current) return; // already initialized

      const map = new Map(containerRef.current, {
        authOptions: { authType: 'subscriptionKey', subscriptionKey: mapsKey },
        style: 'night',
        zoom: 10,
        center: stops.length > 0 ? [stops[0].lng, stops[0].lat] : [-90.1, 38.7],
      });

      mapRef.current = map;

      map.events.add('ready', () => {
        renderStops(map, stops, HtmlMarker, onStopClick);
        if (stops.length > 1) fitBounds(map, stops, data);
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.dispose();
        mapRef.current = null;
      }
    };
  }, [mapsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when stops change
  useEffect(() => {
    if (!mapRef.current) return;
    import('azure-maps-control').then(({ HtmlMarker, data }) => {
      const map = mapRef.current;
      map.markers.clear();
      renderStops(map, stops, HtmlMarker, onStopClick);
      if (stops.length > 1) fitBounds(map, stops, data);
    });
  }, [stops, onStopClick]);

  if (keyError) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 h-64 flex items-center justify-center">
        <p className="text-sm text-slate-500 text-center px-6">
          Map unavailable: {keyError}
        </p>
      </div>
    );
  }

  if (!mapsKey) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 h-64 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-t-2 border-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700/60" style={{ height: '400px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {stops.length > 0 && (
        <div className="absolute bottom-3 right-3 flex items-center gap-3 bg-slate-900/90 rounded-lg px-3 py-2 text-[10px] text-slate-400 pointer-events-none">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Prospect
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Client
          </span>
        </div>
      )}
    </div>
  );
}

function renderStops(map, stops, HtmlMarker, onStopClick) {
  stops.forEach((stop) => {
    if (!stop.lat || !stop.lng) return;
    const color  = STOP_COLORS[stop.type] || '#6b7280';
    const marker = new HtmlMarker({
      position: [stop.lng, stop.lat],
      color,
      text: stop.name.charAt(0).toUpperCase(),
      title: stop.name,
    });
    if (onStopClick) {
      map.events.add('click', marker, () => onStopClick(stop));
    }
    map.markers.add(marker);
  });
}

function fitBounds(map, stops, data) {
  const valid  = stops.filter((s) => s.lat && s.lng);
  if (valid.length < 2) return;
  const lngs   = valid.map((s) => s.lng);
  const lats   = valid.map((s) => s.lat);
  const bounds = new data.BoundingBox(
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  );
  map.setCamera({ bounds, padding: 60, duration: 500 });
}
