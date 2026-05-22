import type { StationWithDistance } from '../services/stationsApi';

export function formatStationDistanceForSpeech(distanceKm: number | undefined): string {
  if (typeof distanceKm !== 'number' || !Number.isFinite(distanceKm) || distanceKm <= 0.0001) {
    return '';
  }
  return `${distanceKm.toFixed(1)} kilometers away`;
}

/** Concise label for station card / map marker buttons. */
export function buildStationCardAriaLabel(station: StationWithDistance, selected = false): string {
  const title = station.locationName?.trim() || station.chargePointId;
  const parts = [
    title,
    `Status: ${station.status}`,
    `${station.availableConnectors ?? 0} of ${station.totalConnectors ?? 0} connectors available`,
    formatStationDistanceForSpeech(station.distanceKm),
    selected ? 'Selected' : '',
    'Open station details',
  ].filter(Boolean);
  return parts.join('. ');
}
