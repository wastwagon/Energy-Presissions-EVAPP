/**
 * Stations Redux Slice
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { stationsApi } from '../../services/stationsApi';
import { StationWithDistance, ChargePoint, ApiError } from '../../types';

interface StationsState {
  nearbyStations: StationWithDistance[];
  selectedStation: ChargePoint | null;
  isLoading: boolean;
  error: string | null;
  userLocation: { latitude: number; longitude: number } | null;
}

const initialState: StationsState = {
  nearbyStations: [],
  selectedStation: null,
  isLoading: false,
  error: null,
  userLocation: null,
};

export const fetchNearbyStations = createAsyncThunk(
  'stations/fetchNearby',
  async (
    {
      latitude,
      longitude,
      radiusKm,
    }: { latitude: number; longitude: number; radiusKm?: number },
    { rejectWithValue }
  ) => {
    try {
      const stations = await stationsApi.getNearbyStations(
        latitude,
        longitude,
        radiusKm
      );
      return { stations, location: { latitude, longitude } };
    } catch (error: any) {
      return rejectWithValue(
        (error as ApiError).message || 'Failed to fetch stations'
      );
    }
  }
);

export const fetchStationById = createAsyncThunk(
  'stations/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await stationsApi.getStationById(id);
    } catch (error: any) {
      return rejectWithValue(
        (error as ApiError).message || 'Failed to fetch station'
      );
    }
  }
);

const stationsSlice = createSlice({
  name: 'stations',
  initialState,
  reducers: {
    setUserLocation: (
      state,
      action: PayloadAction<{ latitude: number; longitude: number }>
    ) => {
      state.userLocation = action.payload;
    },
    setSelectedStation: (state, action: PayloadAction<ChargePoint | null>) => {
      state.selectedStation = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch nearby stations
    builder
      .addCase(fetchNearbyStations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNearbyStations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.nearbyStations = action.payload.stations;
        state.userLocation = action.payload.location;
      })
      .addCase(fetchNearbyStations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch station by ID
    builder
      .addCase(fetchStationById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStationById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedStation = action.payload;
      })
      .addCase(fetchStationById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUserLocation, setSelectedStation, clearError } =
  stationsSlice.actions;
export default stationsSlice.reducer;
