/**
 * Station Detail Screen
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { RootState, AppDispatch } from '../store/store';
import { fetchStationById } from '../store/slices/stationsSlice';
import MapView, { Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Linking } from 'react-native';

type StationDetailScreenRouteProp = RouteProp<
  MainStackParamList,
  'StationDetail'
>;
type StationDetailScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  'StationDetail'
>;

interface Props {
  navigation: StationDetailScreenNavigationProp;
}

export default function StationDetailScreen({ navigation }: Props) {
  const theme = useTheme();
  const route = useRoute<StationDetailScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedStation, isLoading } = useSelector(
    (state: RootState) => state.stations
  );

  const { stationId } = route.params;

  useEffect(() => {
    dispatch(fetchStationById(stationId));
  }, [stationId, dispatch]);

  const handleGetDirections = () => {
    if (
      selectedStation?.locationLatitude &&
      selectedStation?.locationLongitude
    ) {
      const url = `https://maps.google.com/maps?daddr=${selectedStation.locationLatitude},${selectedStation.locationLongitude}`;
      Linking.openURL(url);
    }
  };

  const handleStartCharging = () => {
    navigation.navigate('StartCharging', {
      stationId: selectedStation?.id || stationId,
    });
  };

  if (isLoading || !selectedStation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Map */}
        {selectedStation.locationLatitude &&
          selectedStation.locationLongitude && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: selectedStation.locationLatitude,
                longitude: selectedStation.locationLongitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: selectedStation.locationLatitude,
                  longitude: selectedStation.locationLongitude,
                }}
                title={selectedStation.locationName || selectedStation.chargePointId}
              />
            </MapView>
          )}

        {/* Station Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.stationName}>
              {selectedStation.locationName || selectedStation.chargePointId}
            </Text>
            <Text variant="bodyMedium" style={styles.stationId}>
              {selectedStation.chargePointId}
            </Text>

            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Icon name="bolt" size={20} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.detailText}>
                  Capacity: {selectedStation.totalCapacityKw || 'N/A'} kW
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="attach-money" size={20} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.detailText}>
                  Price: {selectedStation.currency || 'GHS'}{' '}
                  {selectedStation.pricePerKwh?.toFixed(2) || '0.00'}/kWh
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Icon
                  name={
                    selectedStation.status === 'Available'
                      ? 'check-circle'
                      : 'cancel'
                  }
                  size={20}
                  color={
                    selectedStation.status === 'Available'
                      ? '#10b981'
                      : theme.colors.error
                  }
                />
                <Text variant="bodyMedium" style={styles.detailText}>
                  Status: {selectedStation.status || 'Unknown'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            icon="directions"
            onPress={handleGetDirections}
            style={styles.actionButton}
          >
            Get Directions
          </Button>
          <Button
            mode="contained"
            icon="play-arrow"
            onPress={handleStartCharging}
            style={styles.actionButton}
            disabled={selectedStation.status !== 'Available'}
          >
            Start Charging
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  map: {
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
  },
  card: {
    elevation: 2,
    marginBottom: 16,
  },
  stationName: {
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  stationId: {
    color: '#64748b',
    marginBottom: 16,
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#1e293b',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});
