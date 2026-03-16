/**
 * Offline Indicator Component
 * Shows when the app is offline
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Banner } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/MaterialIcons';

export function OfflineIndicator() {
  const [isConnected, setIsConnected] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      setIsVisible(!connected);
    });

    // Check initial state
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      setIsVisible(!connected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Banner
      visible={isVisible}
      actions={[
        {
          label: 'Dismiss',
          onPress: () => setIsVisible(false),
        },
      ]}
      icon={({ size }) => (
        <Icon name="wifi-off" size={size} color="#dc2626" />
      )}
      style={styles.banner}
    >
      <Text variant="bodyMedium">No internet connection. Some features may be unavailable.</Text>
    </Banner>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fee2e2',
  },
});
