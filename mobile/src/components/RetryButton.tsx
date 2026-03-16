/**
 * Retry Button Component
 * Displays a retry button with loading state
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface RetryButtonProps {
  onPress: () => void;
  loading?: boolean;
  label?: string;
  style?: any;
}

export function RetryButton({
  onPress,
  loading = false,
  label = 'Retry',
  style,
}: RetryButtonProps) {
  return (
    <Button
      mode="outlined"
      onPress={onPress}
      loading={loading}
      disabled={loading}
      icon={() => <Icon name="refresh" size={20} />}
      style={[styles.button, style]}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    marginVertical: 8,
  },
});
