/**
 * Loading Skeleton Component
 * Shows placeholder content while loading
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  style?: any;
  borderRadius?: number;
}

export function LoadingSkeleton({
  width = '100%',
  height = 20,
  style,
  borderRadius = 4,
}: LoadingSkeletonProps) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.cardContainer}>
      <LoadingSkeleton width="60%" height={24} style={styles.title} />
      <LoadingSkeleton width="40%" height={16} style={styles.subtitle} />
      <LoadingSkeleton width="100%" height={16} style={styles.line} />
      <LoadingSkeleton width="80%" height={16} style={styles.line} />
    </View>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e2e8f0',
  },
  cardContainer: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 2,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
  },
  line: {
    marginBottom: 8,
  },
});
