/**
 * Transaction History Screen
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { RootState, AppDispatch } from '../store/store';
import { fetchUserTransactions } from '../store/slices/transactionsSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

type TransactionHistoryScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  'TransactionHistory'
>;

interface Props {
  navigation: TransactionHistoryScreenNavigationProp;
}

export default function TransactionHistoryScreen({ navigation }: Props) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { transactions, isLoading } = useSelector(
    (state: RootState) => state.transactions
  );

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserTransactions(user.id));
    }
  }, [user?.id, dispatch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      await dispatch(fetchUserTransactions(user.id));
    }
    setRefreshing(false);
  }, [user?.id, dispatch]);

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
        ) : transactions.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No transactions found
              </Text>
            </Card.Content>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <Card
              key={transaction.id}
              style={styles.transactionCard}
              onPress={() =>
                navigation.navigate('TransactionDetail', {
                  transactionId: transaction.id,
                })
              }
            >
              <Card.Content>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    <Text variant="titleMedium" style={styles.stationName}>
                      {transaction.chargePointId}
                    </Text>
                    <Text variant="bodySmall" style={styles.date}>
                      {new Date(transaction.startTime).toLocaleString()}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.transactionDetails}>
                  <View style={styles.detailRow}>
                    <Icon name="bolt" size={16} color={theme.colors.primary} />
                    <Text variant="bodySmall">
                      {transaction.totalEnergyKwh?.toFixed(2) || '0.00'} kWh
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Icon name="attach-money" size={16} color={theme.colors.primary} />
                    <Text variant="bodySmall" style={styles.cost}>
                      GHS {transaction.totalCost?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Icon
                      name={
                        transaction.status === 'Completed'
                          ? 'check-circle'
                          : transaction.status === 'Active'
                          ? 'play-circle'
                          : 'cancel'
                      }
                      size={16}
                      color={
                        transaction.status === 'Completed'
                          ? '#10b981'
                          : transaction.status === 'Active'
                          ? theme.colors.primary
                          : theme.colors.error
                      }
                    />
                    <Text variant="bodySmall">{transaction.status}</Text>
                  </View>
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
  transactionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  stationName: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  date: {
    color: '#64748b',
    marginTop: 4,
  },
  transactionDetails: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cost: {
    fontWeight: 'bold',
    color: '#0A3D62',
  },
});
