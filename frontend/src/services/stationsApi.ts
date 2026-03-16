import { api } from './api';

export interface StationWithDistance {
  id: number;
  chargePointId: string;
  vendorId: number;
  vendorName?: string;
  model?: string;
  status: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
  locationName?: string;
  locationCity?: string;
  locationRegion?: string;
  locationDistrict?: string;
  locationMunicipality?: string;
  locationLandmarks?: string;
  amenities?: string[];
  operatingHours?: Record<string, string>;
  distanceKm: number;
  availableConnectors: number;
  totalConnectors: number;
  activeSessions: number;
  totalCapacityKw?: number;
  pricePerKwh?: number;
  currency?: string;
}

export interface NearbyStationsQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  status?: string[];
  connectorType?: string;
  minPowerKw?: number;
  limit?: number;
}

export interface MapBoundsQuery {
  north: number;
  south: number;
  east: number;
  west: number;
  status?: string[];
}

export interface StationDetails {
  id: number;
  chargePointId: string;
  vendorId: number;
  vendorName?: string;
  model?: string;
  status: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
  locationName?: string;
  locationCity?: string;
  locationRegion?: string;
  locationDistrict?: string;
  locationMunicipality?: string;
  locationLandmarks?: string;
  amenities?: string[];
  operatingHours?: Record<string, string>;
  connectors: Array<{
    id: number;
    connectorId: number;
    connectorType?: string;
    powerRatingKw?: number;
    status: string;
  }>;
  activeSessions: number;
  availableConnectors: number;
  totalConnectors: number;
  totalCapacityKw?: number;
  pricePerKwh?: number;
  currency?: string;
}

export const stationsApi = {
  /**
   * Find nearby stations (public endpoint)
   */
  findNearby: async (query: NearbyStationsQuery): Promise<StationWithDistance[]> => {
    const params = new URLSearchParams();
    params.append('latitude', query.latitude.toString());
    params.append('longitude', query.longitude.toString());
    if (query.radiusKm) params.append('radiusKm', query.radiusKm.toString());
    if (query.status) params.append('status', query.status.join(','));
    if (query.connectorType) params.append('connectorType', query.connectorType);
    if (query.minPowerKw) params.append('minPowerKw', query.minPowerKw.toString());
    if (query.limit) params.append('limit', query.limit.toString());

    const response = await api.get(`/stations/nearby?${params.toString()}`);
    return response.data;
  },

  /**
   * Get stations in map bounds (public endpoint)
   */
  findInBounds: async (query: MapBoundsQuery): Promise<StationWithDistance[]> => {
    const params = new URLSearchParams();
    params.append('north', query.north.toString());
    params.append('south', query.south.toString());
    params.append('east', query.east.toString());
    params.append('west', query.west.toString());
    if (query.status) params.append('status', query.status.join(','));

    const response = await api.get(`/stations/map?${params.toString()}`);
    return response.data;
  },

  /**
   * Search stations by location name, city, or region (public endpoint)
   */
  search: async (searchTerm: string, limit?: number): Promise<StationWithDistance[]> => {
    const params = new URLSearchParams();
    params.append('q', searchTerm);
    if (limit) params.append('limit', limit.toString());

    const response = await api.get(`/stations/search?${params.toString()}`);
    return response.data;
  },

  /**
   * Get stations by charge point IDs (for favorites)
   */
  getByIds: async (chargePointIds: string[]): Promise<StationWithDistance[]> => {
    if (chargePointIds.length === 0) return [];
    const ids = chargePointIds.join(',');
    const response = await api.get(`/stations/by-ids?ids=${encodeURIComponent(ids)}`);
    return response.data;
  },

  /**
   * Get station details (authenticated endpoint)
   */
  getDetails: async (chargePointId: string): Promise<StationDetails> => {
    const response = await api.get(`/stations/${chargePointId}`);
    return response.data;
  },
};
