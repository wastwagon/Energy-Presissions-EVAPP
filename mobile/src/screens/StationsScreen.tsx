/**
 * Stations Screen - Find Nearby Charging Stations
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button } from 'react-native-paper';
import { CardSkeleton } from '../components/LoadingSkeleton';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { RootState, AppDispatch } from '../store/store';
import {
  fetchNearbyStations,
  setUserLocation,
  setSelectedStation,
} from '../store/slices/stationsSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Platform } from 'react-native';

type StationsScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  'MainTabs'
>;

interface Props {
  navigation: StationsScreenNavigationProp;
}

export default function StationsScreen({ navigation }: Props) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { nearbyStations, userLocation, isLoading } = useSelector(
    (state: RootState) => state.stations
  );

  const [refreshing, setRefreshing] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (locationPermission && userLocation) {
      dispatch(
        fetchNearbyStations({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radiusKm: 10,
        })
      );
    }
  }, [locationPermission, userLocation, dispatch]);

  const requestLocationPermission = async () => {
    try {
      // For now, request permission directly via Geolocation
      // In production, use react-native-permissions library
      Geolocation.requestAuthorization();
      setLocationPermission(true);
      getCurrentLocation();
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        dispatch(
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        );
      },
      (error) => {
        console.error('Location error:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userLocation) {
      await dispatch(
        fetchNearbyStations({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radiusKm: 10,
        })
      );
    } else {
      getCurrentLocation();
    }
    setRefreshing(false);
  };

  const handleStationPress = (station: any) => {
    dispatch(setSelectedStation(station));
    navigation.navigate('StationDetail', { stationId: station.id });
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      {userLocation && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {nearbyStations.map((station) => (
            <Marker
              key={station.id}
              coordinate={{
                latitude: station.locationLatitude || 0,
                longitude: station.locationLongitude || 0,
              }}
              title={station.locationName || station.chargePointId}
              description={`${station.pricePerKwh || 0} GHS/kWh`}
              onPress={() => handleStationPress(station)}
            />
          ))}
        </MapView>
      )}

      {/* Stations List */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!locationPermission && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.permissionText}>
                Location permission is required to find nearby stations
              </Text>
              <Button
                mode="contained"
                onPress={requestLocationPermission}
                style={styles.permissionButton}
              >
                Enable Location
              </Button>
            </Card.Content>
          </Card>
        )}

        {isLoading && !refreshing && (
          <View style={styles.loaderContainer}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </View>
        )}

        {nearbyStations.length === 0 && !isLoading && locationPermission && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No stations found nearby
              </Text>
            </Card.Content>
          </Card>
        )}

        {nearbyStations.map((station) => (
          <Card
            key={station.id}
            style={styles.stationCard}
            onPress={() => handleStationPress(station)}
          >
            <Card.Content>
              <View style={styles.stationHeader}>
                <View style={styles.stationInfo}>
                  <Text variant="titleMedium" style={styles.stationName}>
                    {station.locationName || station.chargePointId}
                  </Text>
                  {station.distance && (
                    <Text variant="bodySmall" style={styles.distance}>
                      {station.distance.toFixed(1)} km away
                    </Text>
                  )}
                </View>
                <Icon name="chevron-right" size={24} color={theme.colors.primary} />
              </View>

              <View style={styles.stationDetails}>
                <View style={styles.detailRow}>
                  <Icon name="bolt" size={16} color={theme.colors.primary} />
                  <Text variant="bodySmall" style={styles.detailText}>
                    {station.totalCapacityKw || 'N/A'} kW
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="attach-money" size={16} color={theme.colors.primary} />
                  <Text variant="bodySmall" style={styles.detailText}>
                    {station.currency || 'GHS'} {station.pricePerKwh?.toFixed(2) || '0.00'}/kWh
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon
                    name={
                      station.status === 'Available' ? 'check-circle' : 'cancel'
                    }
                    size={16}
                    color={
                      station.status === 'Available'
                        ? '#10b981'
                        : theme.colors.error
                    }
                  />
                  <Text variant="bodySmall" style={styles.detailText}>
                    {station.status || 'Unknown'}
                  </Text>
                </View>
              </View>

              <Button
                mode="contained"
                onPress={() => {
                  dispatch(setSelectedStation(station));
                  navigation.navigate('StartCharging', {
                    stationId: station.id,
                  });
                }}
                style={styles.startButton}
                disabled={station.status !== 'Available'}
              >
                Start Charging
              </Button>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    height: 300,
  },
  list: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#64748b',
  },
  permissionButton: {
    marginTop: 8,
  },
  loader: {
    marginVertical: 40,
  },
  loaderContainer: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginVertical: 20,
  },
  stationCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  distance: {
    color: '#64748b',
    marginTop: 4,
  },
  stationDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: '#64748b',
  },
  startButton: {
    marginTop: 8,
  },
});
