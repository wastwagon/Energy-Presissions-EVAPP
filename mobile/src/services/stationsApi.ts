/**
 * Stations API Service
 */

import { api } from './api';
import { StationWithDistance, ChargePoint } from '../types';

export const stationsApi = {
  /**
   * Get nearby stations
   */
  getNearbyStations: async (
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<StationWithDistance[]> => {
    const response = await api.get('/stations/nearby', {
      params: { latitude, longitude, radiusKm },
    });
    return response.data;
  },

  /**
   * Get station by ID
   */
  getStationById: async (id: string): Promise<ChargePoint> => {
    const response = await api.get(`/charge-points/${id}`);
    return response.data;
  },

  /**
   * Search stations
   */
  searchStations: async (query: string): Promise<ChargePoint[]> => {
    const response = await api.get('/stations/search', {
      params: { q: query },
    });
    return response.data;
  },
};
