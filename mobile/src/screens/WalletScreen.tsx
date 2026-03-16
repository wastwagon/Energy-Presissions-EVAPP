/**
 * Wallet Screen
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { LoadingSkeleton, CardSkeleton } from '../components/LoadingSkeleton';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { RootState, AppDispatch } from '../store/store';
import { fetchAvailableBalance, fetchTransactions } from '../store/slices/walletSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

type WalletScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  'MainTabs'
>;

interface Props {
  navigation: WalletScreenNavigationProp;
}

export default function WalletScreen({ navigation }: Props) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { availableBalance, transactions, isLoading } = useSelector(
    (state: RootState) => state.wallet
  );

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchAvailableBalance(user.id));
      dispatch(fetchTransactions({ userId: user.id, limit: 20 }));
    }
  }, [user?.id, dispatch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      await Promise.all([
        dispatch(fetchAvailableBalance(user.id)),
        dispatch(fetchTransactions({ userId: user.id, limit: 20 })),
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
        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <Card.Content>
            <Text variant="labelLarge" style={styles.balanceLabel}>
              Wallet Balance
            </Text>
            {isLoading ? (
              <LoadingSkeleton width="70%" height={48} />
            ) : (
              <>
                <Text variant="headlineLarge" style={styles.balanceAmount}>
                  {availableBalance?.currency || 'GHS'}{' '}
                  {availableBalance?.total?.toFixed(2) || '0.00'}
                </Text>
                {availableBalance && availableBalance.reserved > 0 && (
                  <View style={styles.reservedContainer}>
                    <Text variant="bodySmall" style={styles.reservedText}>
                      Available: {availableBalance.currency || 'GHS'}{' '}
                      {availableBalance.available.toFixed(2)}
                    </Text>
                    <Text variant="bodySmall" style={styles.reservedText}>
                      Reserved: {availableBalance.currency || 'GHS'}{' '}
                      {availableBalance.reserved.toFixed(2)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </Card.Content>
        </Card>

        {/* Top Up Button */}
        <Button
          mode="contained"
          icon="add-circle"
          onPress={() => navigation.navigate('TopUp')}
          style={styles.topUpButton}
        >
          Top Up Wallet
        </Button>

        {/* Transactions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Transactions
            </Text>
            {isLoading ? (
              <CardSkeleton />
            ) : transactions.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No transactions yet
              </Text>
            ) : (
              transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionRow}>
                  <View style={styles.transactionInfo}>
                    <Text variant="titleSmall" style={styles.transactionType}>
                      {transaction.type}
                    </Text>
                    <Text variant="bodySmall" style={styles.transactionDate}>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </Text>
                    {transaction.description && (
                      <Text variant="bodySmall" style={styles.transactionDesc}>
                        {transaction.description}
                      </Text>
                    )}
                  </View>
                  <Text
                    variant="titleMedium"
                    style={[
                      styles.transactionAmount,
                      transaction.type === 'TopUp' || transaction.type === 'Refund'
                        ? styles.positiveAmount
                        : styles.negativeAmount,
                    ]}
                  >
                    {transaction.type === 'TopUp' || transaction.type === 'Refund'
                      ? '+'
                      : '-'}
                    {transaction.currency || 'GHS'} {Math.abs(transaction.amount).toFixed(2)}
                  </Text>
                </View>
              ))
            )}
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
  balanceCard: {
    backgroundColor: '#0A3D62',
    marginBottom: 16,
    elevation: 4,
  },
  balanceLabel: {
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  reservedContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  reservedText: {
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  topUpButton: {
    marginBottom: 16,
  },
  card: {
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1e293b',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginVertical: 20,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionType: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  transactionDate: {
    color: '#64748b',
    marginTop: 4,
  },
  transactionDesc: {
    color: '#64748b',
    marginTop: 4,
  },
  transactionAmount: {
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#10b981',
  },
  negativeAmount: {
    color: '#dc2626',
  },
});
