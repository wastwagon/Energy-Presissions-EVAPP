import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography } from '@mui/material';
import type { StationWithDistance } from '../../services/stationsApi';
import './stationsMap.css';

const ACCRA: L.LatLngTuple = [5.6037, -0.187];

function evDivHtml(selected: boolean): string {
  const size = selected ? 34 : 28;
  const ring = selected ? '0 0 0 3px rgba(25, 118, 210, 0.55)' : 'none';
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#e53935;box-shadow:${ring},0 2px 8px rgba(0,0,0,0.35);border:2px solid #fff;display:flex;align-items:center;justify-content:center">
    <span style="font-size:${selected ? 16 : 14}px;line-height:1">⚡</span>
  </div>`;
}

function makeEvIcon(selected: boolean) {
  const size = selected ? 34 : 28;
  return L.divIcon({
    className: `stations-map-marker-wrap${selected ? ' stations-map-marker-wrap--selected' : ''}`,
    html: evDivHtml(selected),
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  });
}

const userIcon = L.divIcon({
  className: 'stations-map-marker-wrap',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#1976d2;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: L.point(18, 18),
  iconAnchor: L.point(9, 9),
});

function MapResize() {
  const map = useMap();
  useEffect(() => {
    const c = map.getContainer();
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(c);
    map.invalidateSize();
    return () => {
      ro.disconnect();
    };
  }, [map]);
  return null;
}

type FitData = {
  stations: StationWithDistance[];
  userLocation: { lat: number; lng: number } | null;
};

/**
 * Re-fit the map only when `mapFitToken` changes (search, near me, first load), not when
 * stations are refreshed from panning the viewport (findInBounds).
 */
function MapFitView({ mapFitToken, dataRef }: { mapFitToken: number; dataRef: MutableRefObject<FitData> }) {
  const map = useMap();

  useEffect(() => {
    const { stations, userLocation } = dataRef.current;
    const latlngs: L.LatLngTuple[] = [];
    if (userLocation) {
      latlngs.push([userLocation.lat, userLocation.lng]);
    }
    for (const s of stations) {
      if (s.locationLatitude != null && s.locationLongitude != null) {
        latlngs.push([s.locationLatitude, s.locationLongitude]);
      }
    }
    if (latlngs.length === 0) {
      map.setView(ACCRA, 10);
      return;
    }
    if (latlngs.length === 1) {
      map.setView(latlngs[0]!, 12);
      return;
    }
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
  }, [map, mapFitToken, dataRef]);

  return null;
}

export type MapViewportBounds = { north: number; south: number; east: number; west: number };

function MapViewportSearch({
  enabled,
  debounceMs,
  ignoreMoveEndsBefore,
  onBoundsStable,
}: {
  enabled: boolean;
  debounceMs: number;
  ignoreMoveEndsBefore: number;
  onBoundsStable: (b: MapViewportBounds) => void;
}) {
  const map = useMap();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyRef = useRef<string>('');
  const enabledRef = useRef(enabled);
  const onBoundsStableRef = useRef(onBoundsStable);
  const ignoreMoveEndsRef = useRef(ignoreMoveEndsBefore);
  enabledRef.current = enabled;
  onBoundsStableRef.current = onBoundsStable;
  ignoreMoveEndsRef.current = ignoreMoveEndsBefore;

  const scheduleReport = () => {
    if (!enabledRef.current) return;
    if (Date.now() < ignoreMoveEndsRef.current) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      if (!enabledRef.current) return;
      const b = map.getBounds();
      const key = [b.getNorth(), b.getSouth(), b.getEast(), b.getWest()].map((n) => n.toFixed(4)).join('|');
      if (key === lastKeyRef.current) return;
      lastKeyRef.current = key;
      onBoundsStableRef.current({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    }, debounceMs);
  };

  useMapEvents({
    moveend: () => {
      scheduleReport();
    },
  });

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  return null;
}

function MapFlyToSelected({
  selectedChargePointId,
  dataRef,
  stationsRevision,
}: {
  selectedChargePointId: string | null;
  dataRef: MutableRefObject<FitData>;
  /** Bumps when `stations` changes so we re-try if coords were not in list yet */
  stationsRevision: number;
}) {
  const map = useMap();
  const lastFlownRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedChargePointId) {
      lastFlownRef.current = null;
      return;
    }
    const s = dataRef.current.stations.find((x) => x.chargePointId === selectedChargePointId);
    if (!s || s.locationLatitude == null || s.locationLongitude == null) {
      return;
    }
    if (lastFlownRef.current === selectedChargePointId) {
      return;
    }
    lastFlownRef.current = selectedChargePointId;
    const z = Math.max(map.getZoom(), 15);
    map.flyTo([s.locationLatitude, s.locationLongitude], z, { duration: 0.4 });
  }, [map, selectedChargePointId, dataRef, stationsRevision]);

  return null;
}

function StationMapMarker({
  station,
  selected,
  onSelect,
}: {
  station: StationWithDistance;
  selected: boolean;
  onSelect: (station: StationWithDistance) => void;
}) {
  const icon = useMemo(() => makeEvIcon(selected), [selected]);
  if (station.locationLatitude == null || station.locationLongitude == null) return null;
  return (
    <Marker
      position={[station.locationLatitude, station.locationLongitude]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(station),
      }}
    />
  );
}

export type StationsMapViewProps = {
  stations: StationWithDistance[];
  userLocation: { lat: number; lng: number } | null;
  selectedChargePointId: string | null;
  onSelectStation: (station: StationWithDistance) => void;
  /** Increment to fit map to current stations (search, near me, initial load). Not for viewport (pan) refresh. */
  mapFitToken: number;
  /** Ignore viewport `findInBounds` until this time (ms since epoch) to avoid refits from programmatic moves */
  ignoreViewportBoundsMoveEndsBefore: number;
  /** Fires when the user has finished panning/zooming; load stations in view. */
  onViewportBoundsStable: (bounds: MapViewportBounds) => void;
  /** When false, viewport search is not requested (e.g. list view or no data yet) */
  viewportSearchEnabled: boolean;
};

const VIEWPORT_DEBOUNCE_MS = 500;

/**
 * OpenStreetMap + markers (no API key). Optimized for mobile: fills parent height.
 */
export function StationsMapView({
  stations,
  userLocation,
  selectedChargePointId,
  onSelectStation,
  mapFitToken,
  ignoreViewportBoundsMoveEndsBefore,
  onViewportBoundsStable,
  viewportSearchEnabled,
}: StationsMapViewProps) {
  const [mounted, setMounted] = useState(false);
  const dataRef = useRef<FitData>({ stations, userLocation });
  dataRef.current = { stations, userLocation };
  const stationsRevision = useMemo(
    () => stations.reduce((n, s) => n + s.chargePointId.length, 0),
    [stations],
  );
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box
        sx={{
          height: '100%',
          minHeight: 200,
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: { xs: 0, sm: 1 },
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Loading map…
        </Typography>
      </Box>
    );
  }

  return (
    <MapContainer
      center={ACCRA}
      zoom={10}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      scrollWheelZoom
      data-testid="stations-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapResize />
      <MapFitView dataRef={dataRef} mapFitToken={mapFitToken} />
      <MapViewportSearch
        enabled={viewportSearchEnabled}
        debounceMs={VIEWPORT_DEBOUNCE_MS}
        ignoreMoveEndsBefore={ignoreViewportBoundsMoveEndsBefore}
        onBoundsStable={onViewportBoundsStable}
      />
      <MapFlyToSelected
        dataRef={dataRef}
        selectedChargePointId={selectedChargePointId}
        stationsRevision={stationsRevision}
      />
      {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />}
      {stations.map((s) => (
        <StationMapMarker
          key={s.chargePointId}
          station={s}
          selected={s.chargePointId === selectedChargePointId}
          onSelect={onSelectStation}
        />
      ))}
    </MapContainer>
  );
}
