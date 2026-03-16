/**
 * Profile Screen
 * Edit profile and delete account
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  Divider,
  useTheme,
  TextInput,
  Portal,
  Dialog,
  Paragraph,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { RootState, AppDispatch } from '../store/store';
import { logout, setUser } from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usersApi } from '../services/usersApi';

type ProfileScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  'MainTabs'
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

export default function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await usersApi.update(user.id, formData);
      dispatch(setUser(updated));
      await AsyncStorage.setItem('user', JSON.stringify(updated));
      setEditing(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    try {
      setDeleting(true);
      setError(null);
      await usersApi.delete(user.id);
      await AsyncStorage.multiRemove([
        'token',
        'user',
        'currentVendorId',
        'currentVendorName',
        'isImpersonating',
      ]);
      dispatch(logout());
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const showDeleteConfirm = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? All your data, wallet balance, and transaction history will be lost. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setDeleteDialogVisible(true),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {error && (
          <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.colors.error }]}>
            <Card.Content>
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>{error}</Text>
            </Card.Content>
          </Card>
        )}
        {success && (
          <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
            <Card.Content>
              <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>{success}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Profile Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Icon name="person" size={48} color={theme.colors.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.name}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text variant="bodyMedium" style={styles.email}>
                  {user?.email}
                </Text>
                <Text variant="bodySmall" style={styles.accountType}>
                  {user?.accountType}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Edit Profile */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                {editing ? 'Edit Profile' : 'Profile Information'}
              </Text>
              {!editing ? (
                <Button mode="compact" onPress={() => setEditing(true)} icon="pencil">
                  Edit
                </Button>
              ) : (
                <View style={styles.editActions}>
                  <Button
                    mode="compact"
                    onPress={() => {
                      setEditing(false);
                      setFormData({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                      });
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    compact
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                  >
                    Save
                  </Button>
                </View>
              )}
            </View>
            {editing ? (
              <View style={styles.form}>
                <TextInput
                  label="First Name"
                  value={formData.firstName}
                  onChangeText={(t) => setFormData({ ...formData, firstName: t })}
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Last Name"
                  value={formData.lastName}
                  onChangeText={(t) => setFormData({ ...formData, lastName: t })}
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Email"
                  value={formData.email}
                  onChangeText={(t) => setFormData({ ...formData, email: t })}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
                <TextInput
                  label="Phone"
                  value={formData.phone}
                  onChangeText={(t) => setFormData({ ...formData, phone: t })}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
            ) : (
              <>
                <List.Item
                  title="Phone"
                  description={user?.phone || 'Not provided'}
                  left={(props) => <List.Icon {...props} icon="phone" />}
                />
                <Divider />
                <List.Item
                  title="Account Status"
                  description={user?.status || 'Active'}
                  left={(props) => <List.Icon {...props} icon="check-circle" />}
                />
                <Divider />
                <List.Item
                  title="Email Verified"
                  description={user?.emailVerified ? 'Yes' : 'No'}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={user?.emailVerified ? 'verified' : 'warning'}
                    />
                  )}
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Actions
            </Text>
            <Button
              mode="outlined"
              icon="history"
              onPress={() => navigation.navigate('TransactionHistory')}
              style={styles.actionButton}
            >
              Transaction History
            </Button>
            <Button
              mode="outlined"
              icon="receipt"
              onPress={() => navigation.navigate('ActiveSessions')}
              style={styles.actionButton}
            >
              Active Sessions
            </Button>
          </Card.Content>
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.colors.error }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.error, marginBottom: 8 }}>
              Danger Zone
            </Text>
            <Text variant="bodySmall" style={styles.dangerText}>
              Permanently delete your account and all associated data. This cannot be undone.
            </Text>
            <Button
              mode="outlined"
              icon="delete-forever"
              onPress={showDeleteConfirm}
              textColor={theme.colors.error}
              style={[styles.actionButton, { borderColor: theme.colors.error }]}
            >
              Delete Account
            </Button>
          </Card.Content>
        </Card>

        {/* Logout */}
        <Button
          mode="contained"
          buttonColor={theme.colors.error}
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </View>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => !deleting && setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              This action cannot be undone. All your data will be permanently deleted.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              onPress={handleDeleteAccount}
              textColor={theme.colors.error}
              loading={deleting}
              disabled={deleting}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  email: {
    color: '#64748b',
    marginTop: 4,
  },
  accountType: {
    color: '#64748b',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1e293b',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  form: {
    gap: 12,
  },
  input: {
    marginBottom: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  dangerText: {
    color: '#64748b',
    marginBottom: 12,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 32,
  },
});
