/**
 * Top Up Screen
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
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { RootState, AppDispatch } from '../store/store';
import { topUp, fetchAvailableBalance } from '../store/slices/walletSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

type TopUpScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  'TopUp'
>;

interface Props {
  navigation: TopUpScreenNavigationProp;
}

export default function TopUpScreen({ navigation }: Props) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { availableBalance, isLoading } = useSelector(
    (state: RootState) => state.wallet
  );

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchAvailableBalance(user.id));
    }
  }, [user?.id, dispatch]);

  const handleTopUp = async () => {
    if (!user?.id || !amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError(null);
    const result = await dispatch(
      topUp({
        userId: user.id,
        amount: parseFloat(amount),
        adminNote: note || undefined,
      })
    );

    if (topUp.fulfilled.match(result)) {
      setSuccess(true);
      setAmount('');
      setNote('');
      setTimeout(() => {
        setSuccess(false);
        navigation.goBack();
      }, 2000);
    } else {
      setError('Top-up failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Current Balance */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.balanceRow}>
                <Icon
                  name="account-balance-wallet"
                  size={32}
                  color={theme.colors.primary}
                />
                <View style={styles.balanceInfo}>
                  <Text variant="labelLarge">Current Balance</Text>
                  <Text variant="headlineMedium" style={styles.balanceAmount}>
                    {availableBalance?.currency || 'GHS'}{' '}
                    {availableBalance?.total?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Amount Input */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.inputLabel}>
                Top Up Amount
              </Text>
              <TextInput
                label="Amount"
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  setError(null);
                }}
                mode="outlined"
                keyboardType="decimal-pad"
                style={styles.input}
                left={<TextInput.Affix text="GHS " />}
                error={!!error}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </Card.Content>
          </Card>

          {/* Note Input */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.inputLabel}>
                Note (Optional)
              </Text>
              <TextInput
                label="Note"
                value={note}
                onChangeText={setNote}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="e.g., Payment via mobile money"
              />
            </Card.Content>
          </Card>

          {/* Success Message */}
          {success && (
            <Card style={styles.successCard}>
              <Card.Content>
                <Text style={styles.successText}>
                  Top-up successful! Your wallet has been updated.
                </Text>
              </Card.Content>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleTopUp}
            loading={isLoading}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
            style={styles.submitButton}
            icon="add-circle"
          >
            Top Up Wallet
          </Button>
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
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceAmount: {
    fontWeight: 'bold',
    color: '#0A3D62',
    marginTop: 4,
  },
  inputLabel: {
    marginBottom: 8,
    color: '#1e293b',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#dc2626',
    marginTop: 4,
  },
  successCard: {
    backgroundColor: '#d1fae5',
    marginBottom: 16,
  },
  successText: {
    color: '#065f46',
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 32,
  },
});
