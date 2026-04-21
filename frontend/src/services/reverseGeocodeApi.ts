import { api } from './api';

/** Short area label (e.g. city, suburb + region) from backend reverse geocode. */
export async function reverseGeocodeAreaLabel(lat: number, lng: number): Promise<string | null> {
  try {
    const { data } = await api.get<{ label: string }>('/utils/reverse-geocode', {
      params: { lat, lng },
    });
    const label = typeof data?.label === 'string' ? data.label.trim() : '';
    return label.length > 0 ? label : null;
  } catch {
    return null;
  }
}
