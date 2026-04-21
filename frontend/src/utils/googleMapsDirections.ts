/**
 * Build Google Maps “Directions” URLs (driving). Coordinates often arrive as strings from JSON APIs.
 */
export function parseLatLng(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const la = typeof lat === 'number' && !Number.isNaN(lat) ? lat : parseFloat(String(lat ?? ''));
  const ln = typeof lng === 'number' && !Number.isNaN(lng) ? lng : parseFloat(String(lng ?? ''));
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  return { lat: la, lng: ln };
}

export function buildGoogleMapsDrivingDirectionsUrl(
  destLat: unknown,
  destLng: unknown,
  origin?: { lat: number; lng: number } | null,
): string | null {
  const dest = parseLatLng(destLat, destLng);
  if (!dest) return null;

  const params = new URLSearchParams({
    api: '1',
    travelmode: 'driving',
    destination: `${dest.lat},${dest.lng}`,
  });

  if (
    origin &&
    Number.isFinite(origin.lat) &&
    Number.isFinite(origin.lng)
  ) {
    params.set('origin', `${origin.lat},${origin.lng}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Prefer a new tab; fall back to same-tab navigation (common when in-app browsers block popups). */
export function openGoogleMapsDirections(url: string): void {
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened || opened.closed) {
    window.location.assign(url);
  }
}
