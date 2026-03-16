/**
 * Transaction Detail Screen
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, ActivityIndicator, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootState, AppDispatch } from '../store/store';
import { fetchTransactionById } from '../store/slices/transactionsSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainStackParamList } from '../navigation/MainNavigator';

type TransactionDetailScreenRouteProp = RouteProp<
  MainStackParamList,
  'TransactionDetail'
>;

export default function TransactionDetailScreen() {
  const theme = useTheme();
  const route = useRoute<TransactionDetailScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedTransaction, isLoading } = useSelector(
    (state: RootState) => state.transactions
  );

  const { transactionId } = route.params;

  useEffect(() => {
    dispatch(fetchTransactionById(transactionId));
  }, [transactionId, dispatch]);

  if (isLoading || !selectedTransaction) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const duration =
    selectedTransaction.stopTime && selectedTransaction.startTime
      ? Math.round(
          (new Date(selectedTransaction.stopTime).getTime() -
            new Date(selectedTransaction.startTime).getTime()) /
            1000 /
            60
        )
      : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Transaction Details
            </Text>
            <Text variant="bodyMedium" style={styles.transactionId}>
              ID: {selectedTransaction.transactionId}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Station Information
            </Text>
            <View style={styles.detailRow}>
              <Icon name="ev-station" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge">{selectedTransaction.chargePointId}</Text>
            </View>
            {selectedTransaction.connectorId && (
              <View style={styles.detailRow}>
                <Icon name="power" size={20} color={theme.colors.primary} />
                <Text variant="bodyLarge">
                  Connector: {selectedTransaction.connectorId}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Charging Details
            </Text>
            <View style={styles.detailRow}>
              <Icon name="bolt" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge">
                Energy: {selectedTransaction.totalEnergyKwh?.toFixed(2) || '0.00'} kWh
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="attach-money" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.cost}>
                Total Cost: GHS {selectedTransaction.totalCost?.toFixed(2) || '0.00'}
              </Text>
            </View>
            {duration !== null && (
              <View style={styles.detailRow}>
                <Icon name="access-time" size={20} color={theme.colors.primary} />
                <Text variant="bodyLarge">Duration: {duration} minutes</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Timeline
            </Text>
            <View style={styles.detailRow}>
              <Icon name="play-arrow" size={20} color={theme.colors.primary} />
              <View style={styles.timelineItem}>
                <Text variant="bodyMedium" style={styles.timelineLabel}>
                  Started
                </Text>
                <Text variant="bodySmall" style={styles.timelineValue}>
                  {new Date(selectedTransaction.startTime).toLocaleString()}
                </Text>
              </View>
            </View>
            {selectedTransaction.stopTime && (
              <View style={styles.detailRow}>
                <Icon name="stop" size={20} color={theme.colors.error} />
                <View style={styles.timelineItem}>
                  <Text variant="bodyMedium" style={styles.timelineLabel}>
                    Stopped
                  </Text>
                  <Text variant="bodySmall" style={styles.timelineValue}>
                    {new Date(selectedTransaction.stopTime).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.detailRow}>
              <Icon
                name={
                  selectedTransaction.status === 'Completed'
                    ? 'check-circle'
                    : selectedTransaction.status === 'Active'
                    ? 'play-circle'
                    : 'cancel'
                }
                size={20}
                color={
                  selectedTransaction.status === 'Completed'
                    ? '#10b981'
                    : selectedTransaction.status === 'Active'
                    ? theme.colors.primary
                    : theme.colors.error
                }
              />
              <Text variant="bodyLarge" style={styles.status}>
                Status: {selectedTransaction.status}
              </Text>
            </View>
          </Card.Content>
        </Card>
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
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  transactionId: {
    color: '#64748b',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e293b',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cost: {
    fontWeight: 'bold',
    color: '#0A3D62',
  },
  timelineItem: {
    flex: 1,
  },
  timelineLabel: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  timelineValue: {
    color: '#64748b',
    marginTop: 2,
  },
  status: {
    fontWeight: 'bold',
  },
});
