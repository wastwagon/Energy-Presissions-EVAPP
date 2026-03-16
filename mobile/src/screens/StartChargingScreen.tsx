/**
 * Start Charging Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  TextInput,
  Button,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { RootState, AppDispatch } from '../store/store';
import { fetchStationById } from '../store/slices/stationsSlice';
import { fetchAvailableBalance } from '../store/slices/walletSlice';
import { chargePointsApi } from '../services/chargePointsApi';
import Icon from 'react-native-vector-icons/MaterialIcons';

type StartChargingScreenRouteProp = RouteProp<
  MainStackParamList,
  'StartCharging'
>;
type StartChargingScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  'StartCharging'
>;

interface Props {
  navigation: StartChargingScreenNavigationProp;
}

export default function StartChargingScreen({ navigation }: Props) {
  const theme = useTheme();
  const route = useRoute<StartChargingScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedStation } = useSelector((state: RootState) => state.stations);
  const { availableBalance } = useSelector((state: RootState) => state.wallet);

  const { stationId, connectorId } = route.params;

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStation || selectedStation.id !== stationId) {
      dispatch(fetchStationById(stationId));
    }
    if (user?.id) {
      dispatch(fetchAvailableBalance(user.id));
    }
  }, [stationId, user?.id, dispatch]);

  const pricePerKwh =
    selectedStation?.pricePerKwh || 0;
  const capacityKw = selectedStation?.totalCapacityKw || 0;
  const amountNum = parseFloat(amount) || 0;
  const capacityKwh = pricePerKwh > 0 ? amountNum / pricePerKwh : 0;
  const estimatedHours = capacityKw > 0 ? capacityKwh / capacityKw : 0;

  const handleStart = async () => {
    if (!user?.id || !selectedStation || !amount || amountNum <= 0) {
      return;
    }

    if (availableBalance && amountNum > availableBalance.available) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await chargePointsApi.startWalletCharging(selectedStation.id, {
        connectorId: connectorId || 1,
        userId: user.id,
        amount: amountNum,
      });

      navigation.goBack();
      // Navigate to active sessions or show success message
    } catch (err: any) {
      setError(err.message || 'Failed to start charging');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {selectedStation && (
            <>
              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="titleLarge" style={styles.stationName}>
                    {selectedStation.locationName || selectedStation.chargePointId}
                  </Text>
                  <Text variant="bodyMedium" style={styles.price}>
                    {selectedStation.currency || 'GHS'} {pricePerKwh.toFixed(2)}/kWh
                  </Text>
                </Card.Content>
              </Card>

              {/* Wallet Balance */}
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.balanceRow}>
                    <Icon
                      name="account-balance-wallet"
                      size={24}
                      color={theme.colors.primary}
                    />
                    <View style={styles.balanceInfo}>
                      <Text variant="labelMedium">Available Balance</Text>
                      <Text variant="headlineSmall" style={styles.balanceAmount}>
                        {availableBalance?.currency || 'GHS'}{' '}
                        {availableBalance?.available?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>

              {/* Amount Input */}
              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.inputLabel}>
                    Enter Amount (GHS)
                  </Text>
                  <TextInput
                    label="Amount"
                    value={amount}
                    onChangeText={setAmount}
                    mode="outlined"
                    keyboardType="decimal-pad"
                    style={styles.input}
                    left={<TextInput.Affix text="GHS " />}
                  />
                </Card.Content>
              </Card>

              {/* Calculations */}
              {amountNum > 0 && pricePerKwh > 0 && (
                <Card style={styles.card}>
                  <Card.Content>
                    <Text variant="titleMedium" style={styles.calcTitle}>
                      Charging Details
                    </Text>
                    <View style={styles.calcRow}>
                      <Icon name="bolt" size={20} color={theme.colors.primary} />
                      <Text variant="bodyLarge">
                        Capacity: {capacityKwh.toFixed(2)} kWh
                      </Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Icon name="access-time" size={20} color={theme.colors.primary} />
                      <Text variant="bodyLarge">
                        Estimated Time:{' '}
                        {estimatedHours >= 1
                          ? `${Math.floor(estimatedHours)}h ${Math.round((estimatedHours % 1) * 60)}m`
                          : `${Math.round(estimatedHours * 60)}m`}
                      </Text>
                    </View>
                    <Text variant="bodySmall" style={styles.autoStopText}>
                      Charging will automatically stop when amount is exhausted
                    </Text>
                  </Card.Content>
                </Card>
              )}

              {error && (
                <Card style={styles.errorCard}>
                  <Card.Content>
                    <Text style={styles.errorText}>{error}</Text>
                  </Card.Content>
                </Card>
              )}

              <Button
                mode="contained"
                onPress={handleStart}
                loading={loading}
                disabled={
                  loading ||
                  !amount ||
                  amountNum <= 0 ||
                  (availableBalance !== null &&
                    amountNum > availableBalance.available)
                }
                style={styles.startButton}
                icon="play-arrow"
              >
                Start Charging
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  stationName: {
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  price: {
    color: '#64748b',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceAmount: {
    fontWeight: 'bold',
    color: '#0A3D62',
  },
  inputLabel: {
    marginBottom: 8,
    color: '#1e293b',
  },
  input: {
    marginBottom: 8,
  },
  calcTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e293b',
  },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  autoStopText: {
    marginTop: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
  },
  startButton: {
    marginTop: 8,
    marginBottom: 32,
  },
});
