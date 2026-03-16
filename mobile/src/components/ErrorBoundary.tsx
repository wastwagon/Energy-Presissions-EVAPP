/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service (e.g., Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Card style={styles.card}>
            <Card.Content style={styles.content}>
              <Icon name="error-outline" size={64} color="#dc2626" />
              <Text variant="headlineSmall" style={styles.title}>
                Something went wrong
              </Text>
              <Text variant="bodyMedium" style={styles.message}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </Text>
              
              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text variant="bodySmall" style={styles.errorText}>
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo && (
                    <Text variant="bodySmall" style={styles.errorText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </View>
              )}

              <Button
                mode="contained"
                onPress={this.handleReset}
                style={styles.button}
              >
                Try Again
              </Button>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  message: {
    marginBottom: 24,
    color: '#64748b',
    textAlign: 'center',
  },
  errorDetails: {
    width: '100%',
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    maxHeight: 200,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  button: {
    marginTop: 8,
  },
});
