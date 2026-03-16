/**
 * Main App Component
 */

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { StatusBar, Platform } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './store/store';
import { loadStoredAuth } from './store/slices/authSlice';
import AppNavigator from './navigation/AppNavigator';
import { websocketService } from './services/websocket';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineIndicator } from './components/OfflineIndicator';

// Theme (Clean Motion Ghana brand)
const theme = {
  colors: {
    primary: '#0A3D62',
    accent: '#1A5F7A',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    error: '#dc2626',
  },
};

export default function App() {
  useEffect(() => {
    // Load stored authentication on app start
    store.dispatch(loadStoredAuth());

    // Connect WebSocket when authenticated
    const checkAuthAndConnect = async () => {
      const state = store.getState();
      if (state.auth.isAuthenticated && state.auth.token) {
        try {
          await websocketService.connect();
        } catch (error) {
          console.error('WebSocket connection failed:', error);
        }
      }
    };

    // Subscribe to auth state changes
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      if (state.auth.isAuthenticated && !websocketService.isConnected()) {
        checkAuthAndConnect();
      } else if (!state.auth.isAuthenticated && websocketService.isConnected()) {
        websocketService.disconnect();
      }
    });

    checkAuthAndConnect();

    return () => {
      unsubscribe();
      websocketService.disconnect();
    };
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <StatusBar
              barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
              backgroundColor="#0A3D62"
            />
            <OfflineIndicator />
            <AppNavigator />
          </PaperProvider>
        </SafeAreaProvider>
      </Provider>
    </ErrorBoundary>
  );
}
