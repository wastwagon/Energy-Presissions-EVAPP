/**
 * Dashboard Screen
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { RootState, AppDispatch } from '../store/store';
import { fetchBalance } from '../store/slices/walletSlice';
import { fetchActiveTransactions } from '../store/slices/transactionsSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LoadingSkeleton, CardSkeleton } from '../components/LoadingSkeleton';
import { RetryButton } from '../components/RetryButton';
import { formatError } from '../utils/errorHandler';

type DashboardScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  'MainTabs'
>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

export default function DashboardScreen({ navigation }: Props) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { balance, isLoading: walletLoading } = useSelector(
    (state: RootState) => state.wallet
  );
  const { activeTransactions, isLoading: transactionsLoading, error: transactionsError } = useSelector(
    (state: RootState) => state.transactions
  );
  const { error: walletError } = useSelector((state: RootState) => state.wallet);

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchBalance(user.id));
      dispatch(fetchActiveTransactions(user.id));
    }
  }, [user?.id, dispatch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      await Promise.all([
        dispatch(fetchBalance(user.id)),
        dispatch(fetchActiveTransactions(user.id)),
      ]);
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
        {/* Welcome Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.welcomeText}>
              Welcome, {user?.firstName || 'User'}!
            </Text>
            <Text variant="bodyMedium" style={styles.emailText}>
              {user?.email}
            </Text>
          </Card.Content>
        </Card>

        {/* Wallet Balance Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.balanceRow}>
              <Icon name="account-balance-wallet" size={32} color={theme.colors.primary} />
              <View style={styles.balanceContent}>
                <Text variant="labelLarge" style={styles.balanceLabel}>
                  Wallet Balance
                </Text>
                {walletLoading ? (
                  <LoadingSkeleton width="60%" height={32} />
                ) : walletError ? (
                  <View>
                    <Text variant="bodySmall" style={styles.errorText}>
                      {formatError(walletError).message}
                    </Text>
                    <RetryButton
                      onPress={() => user?.id && dispatch(fetchBalance(user.id))}
                      loading={walletLoading}
                      style={styles.retryButton}
                    />
                  </View>
                ) : (
                  <Text variant="headlineMedium" style={styles.balanceAmount}>
                    {balance?.currency || 'GHS'} {balance?.balance?.toFixed(2) || '0.00'}
                  </Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Active Sessions Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Active Sessions
              </Text>
              {activeTransactions.length > 0 && (
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('ActiveSessions')}
                >
                  View All
                </Button>
              )}
            </View>
            {transactionsLoading ? (
              <CardSkeleton />
            ) : transactionsError ? (
              <View style={styles.errorContainer}>
                <Text variant="bodySmall" style={styles.errorText}>
                  {formatError(transactionsError).message}
                </Text>
                <RetryButton
                  onPress={() => user?.id && dispatch(fetchActiveTransactions(user.id))}
                  loading={transactionsLoading}
                />
              </View>
            ) : activeTransactions.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No active charging sessions
              </Text>
            ) : (
              activeTransactions.slice(0, 3).map((transaction) => (
                <Card
                  key={transaction.id}
                  style={styles.sessionCard}
                  onPress={() =>
                    navigation.navigate('TransactionDetail', {
                      transactionId: transaction.id,
                    })
                  }
                >
                  <Card.Content>
                    <Text variant="titleMedium">
                      {transaction.chargePointId}
                    </Text>
                    <Text variant="bodySmall" style={styles.sessionInfo}>
                      Energy: {transaction.totalEnergyKwh?.toFixed(2) || '0.00'} kWh
                    </Text>
                    <Text variant="bodySmall" style={styles.sessionInfo}>
                      Cost: GHS {transaction.totalCost?.toFixed(2) || '0.00'}
                    </Text>
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Quick Actions
            </Text>
            <View style={styles.actionsRow}>
              <Card
                style={styles.actionCard}
                onPress={() => navigation.navigate('Stations')}
                accessible={true}
                accessibilityLabel="Find charging stations"
                accessibilityRole="button"
              >
                <Card.Content style={styles.actionContent}>
                  <Icon name="ev-station" size={32} color={theme.colors.primary} />
                  <Text variant="labelMedium" style={styles.actionText}>
                    Find Stations
                  </Text>
                </Card.Content>
              </Card>
              <Card
                style={styles.actionCard}
                onPress={() => navigation.navigate('TopUp')}
                accessible={true}
                accessibilityLabel="Top up wallet"
                accessibilityRole="button"
              >
                <Card.Content style={styles.actionContent}>
                  <Icon name="add-circle" size={32} color={theme.colors.primary} />
                  <Text variant="labelMedium" style={styles.actionText}>
                    Top Up
                  </Text>
                </Card.Content>
              </Card>
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
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  welcomeText: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  emailText: {
    color: '#64748b',
    marginTop: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  balanceContent: {
    flex: 1,
  },
  balanceLabel: {
    color: '#64748b',
    marginBottom: 4,
  },
  balanceAmount: {
    fontWeight: 'bold',
    color: '#0A3D62',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 20,
  },
  sessionCard: {
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
  },
  sessionInfo: {
    color: '#64748b',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionText: {
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
});
