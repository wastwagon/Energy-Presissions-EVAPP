/**
 * Active Sessions Screen
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { RootState, AppDispatch } from '../store/store';
import { fetchActiveTransactions } from '../store/slices/transactionsSlice';
import { chargePointsApi } from '../services/chargePointsApi';
import Icon from 'react-native-vector-icons/MaterialIcons';

type ActiveSessionsScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  'ActiveSessions'
>;

interface Props {
  navigation: ActiveSessionsScreenNavigationProp;
}

export default function ActiveSessionsScreen({ navigation }: Props) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { activeTransactions, isLoading } = useSelector(
    (state: RootState) => state.transactions
  );

  const [refreshing, setRefreshing] = React.useState(false);
  const [stoppingId, setStoppingId] = React.useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchActiveTransactions(user.id));
    }
  }, [user?.id, dispatch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      await dispatch(fetchActiveTransactions(user.id));
    }
    setRefreshing(false);
  }, [user?.id, dispatch]);

  const handleStop = async (transaction: any) => {
    setStoppingId(transaction.id);
    try {
      await chargePointsApi.stopTransaction(
        transaction.chargePointId,
        transaction.transactionId
      );
      if (user?.id) {
        await dispatch(fetchActiveTransactions(user.id));
      }
    } catch (error) {
      console.error('Failed to stop transaction:', error);
    } finally {
      setStoppingId(null);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {isLoading && !refreshing ? (
          <ActivityIndicator style={styles.loader} size="large" />
        ) : activeTransactions.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No active charging sessions
              </Text>
            </Card.Content>
          </Card>
        ) : (
          activeTransactions.map((transaction) => (
            <Card key={transaction.id} style={styles.sessionCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.stationName}>
                  {transaction.chargePointId}
                </Text>
                <View style={styles.details}>
                  <View style={styles.detailRow}>
                    <Icon name="bolt" size={16} color={theme.colors.primary} />
                    <Text variant="bodySmall">
                      Energy: {transaction.totalEnergyKwh?.toFixed(2) || '0.00'} kWh
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Icon name="attach-money" size={16} color={theme.colors.primary} />
                    <Text variant="bodySmall">
                      Cost: GHS {transaction.totalCost?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Icon name="access-time" size={16} color={theme.colors.primary} />
                    <Text variant="bodySmall">
                      Started: {new Date(transaction.startTime).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Button
                    mode="outlined"
                    onPress={() =>
                      navigation.navigate('TransactionDetail', {
                        transactionId: transaction.id,
                      })
                    }
                    style={styles.viewButton}
                  >
                    View Details
                  </Button>
                  <Button
                    mode="contained"
                    buttonColor={theme.colors.error}
                    onPress={() => handleStop(transaction)}
                    loading={stoppingId === transaction.id}
                    disabled={stoppingId === transaction.id}
                    style={styles.stopButton}
                  >
                    Stop
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  loader: {
    marginVertical: 40,
  },
  card: {
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginVertical: 20,
  },
  sessionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  stationName: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e293b',
  },
  details: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
  },
  stopButton: {
    flex: 1,
  },
});
