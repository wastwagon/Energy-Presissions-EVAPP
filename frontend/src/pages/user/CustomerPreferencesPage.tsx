import { Box, FormControl, InputLabel, Select, MenuItem, Button, Alert, ListItem, ListItemText } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedSwitchRow } from '../../components/ios/GroupedSwitchRow';
import { authFormFieldSx, compactContainedCtaSx, sxObject } from '../../styles/authShell';
import { iosGroupedListRowSx } from '../../theme/iosGroupedList';
import { triggerHaptic } from '../../utils/haptics';
import { USER_PREF_KEYS } from '../../constants/userPreferences';
import { UserErrorAlert } from '../../components/UserErrorAlert';
import { useState, useEffect } from 'react';

export function CustomerPreferencesPage() {
  const [currency, setCurrency] = useState('GHS');
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrency(localStorage.getItem(USER_PREF_KEYS.currency) || 'GHS');
    setNotifications(localStorage.getItem(USER_PREF_KEYS.notifications) !== 'false');
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(USER_PREF_KEYS.currency, currency);
      localStorage.setItem(USER_PREF_KEYS.notifications, String(notifications));
      triggerHaptic('success');
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('We could not save your preferences. Try again.');
    }
  };

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Preferences"
        subtitle="Currency and notifications"
        updatedAt={null}
        refreshing={false}
        onRefresh={() => undefined}
        showRefresh={false}
        showLiveMeta={false}
        titleVariant="large"
        containerSx={{ mb: 2 }}
      />

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaved(false)}>
          Preferences saved
        </Alert>
      )}
      {error && (
        <UserErrorAlert error={error} context="profile" sx={{ mb: 2 }} onClose={() => setError(null)} />
      )}

      <GroupedListSection title="Display">
        <ListItem sx={{ ...iosGroupedListRowSx, display: 'block', py: 1.5 }} disablePadding>
          <ListItemText
            primary="Currency"
            secondary="Wallet and session amounts use Ghana Cedis (GHS)."
            primaryTypographyProps={{ fontWeight: 500, mb: 0.5 }}
            secondaryTypographyProps={{ mb: 1.25 }}
          />
          <FormControl fullWidth sx={(th) => sxObject(th, authFormFieldSx)}>
            <InputLabel id="pref-currency-label">Currency</InputLabel>
            <Select labelId="pref-currency-label" value="GHS" label="Currency" disabled>
              <MenuItem value="GHS">GHS (Ghana Cedis)</MenuItem>
            </Select>
          </FormControl>
        </ListItem>
      </GroupedListSection>

      <GroupedListSection title="Notifications">
        <GroupedSwitchRow
          label="Session emails"
          secondary="Get email when a charging session starts or ends, and for important wallet alerts."
          checked={notifications}
          onChange={(e) => setNotifications(e.target.checked)}
        />
      </GroupedListSection>

      <Button
        variant="contained"
        disableElevation
        startIcon={<SaveIcon />}
        onClick={handleSave}
        sx={(th) => ({
          ...sxObject(th, compactContainedCtaSx),
          mt: 1,
          width: { xs: '100%', sm: 'auto' },
        })}
      >
        Save preferences
      </Button>
    </Box>
  );
}
