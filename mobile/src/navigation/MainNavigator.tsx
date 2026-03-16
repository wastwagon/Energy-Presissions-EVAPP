/**
 * Main App Navigator (After Authentication)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import StationsScreen from '../screens/StationsScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StationDetailScreen from '../screens/StationDetailScreen';
import StartChargingScreen from '../screens/StartChargingScreen';
import ActiveSessionsScreen from '../screens/ActiveSessionsScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import TopUpScreen from '../screens/TopUpScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  Stations: undefined;
  Wallet: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  StationDetail: { stationId: string };
  StartCharging: { stationId: string; connectorId?: number };
  ActiveSessions: undefined;
  TransactionHistory: undefined;
  TransactionDetail: { transactionId: number };
  TopUp: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Stations') {
            iconName = 'ev-station';
          } else if (route.name === 'Wallet') {
            iconName = 'account-balance-wallet';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0A3D62',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Stations"
        component={StationsScreen}
        options={{ title: 'Find Stations' }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ title: 'Wallet' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0A3D62',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StationDetail"
        component={StationDetailScreen}
        options={{ title: 'Station Details' }}
      />
      <Stack.Screen
        name="StartCharging"
        component={StartChargingScreen}
        options={{ title: 'Start Charging' }}
      />
      <Stack.Screen
        name="ActiveSessions"
        component={ActiveSessionsScreen}
        options={{ title: 'Active Sessions' }}
      />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
        options={{ title: 'Transaction History' }}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{ title: 'Transaction Details' }}
      />
      <Stack.Screen
        name="TopUp"
        component={TopUpScreen}
        options={{ title: 'Top Up Wallet' }}
      />
    </Stack.Navigator>
  );
}
