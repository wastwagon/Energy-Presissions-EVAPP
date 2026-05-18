import { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedSwitchRow } from '../../components/ios/GroupedSwitchRow';
import { authFormFieldSx, compactContainedCtaSx, sxObject } from '../../styles/authShell';
import { iosGroupedListRowSx, iosGroupedRowDividerSx } from '../../theme/iosGroupedList';
import { triggerHaptic } from '../../utils/haptics';
import { useColorMode } from '../../contexts/ColorModeContext';
import { USER_PREF_KEYS, writeDarkModePreference } from '../../constants/userPreferences';

export function CustomerPreferencesPage() {
  const { mode, setMode } = useColorMode();
  const [currency, setCurrency] = useState('GHS');
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const darkMode = mode === 'dark';

  useEffect(() => {
    setCurrency(localStorage.getItem(USER_PREF_KEYS.currency) || 'GHS');
    setNotifications(localStorage.getItem(USER_PREF_KEYS.notifications) !== 'false');
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(USER_PREF_KEYS.currency, currency);
      localStorage.setItem(USER_PREF_KEYS.notifications, String(notifications));
      writeDarkModePreference(darkMode);
      triggerHaptic('success');
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save preferences');
    }
  };

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Preferences"
        subtitle="Customize your experience"
        updatedAt={null}
        refreshing={false}
        onRefresh={() => {}}
        refreshDisabled
        titleVariant="large"
        containerSx={{ mb: 2 }}
      />

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaved(false)}>
          Preferences saved successfully
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <GroupedListSection title="Display">
        <ListItem sx={{ ...iosGroupedListRowSx, display: 'block', py: 1.5 }} disablePadding>
          <ListItemText primary="Currency" primaryTypographyProps={{ fontWeight: 500, mb: 1 }} />
          <FormControl fullWidth size="small" sx={(th) => sxObject(th, authFormFieldSx)}>
            <InputLabel id="pref-currency-label">Currency</InputLabel>
            <Select
              labelId="pref-currency-label"
              value={currency}
              label="Currency"
              onChange={(e) => setCurrency(e.target.value)}
            >
              <MenuItem value="GHS">GHS (Ghana Cedis)</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
            </Select>
          </FormControl>
        </ListItem>
        <Divider sx={iosGroupedRowDividerSx} />
        <GroupedSwitchRow
          label="Dark mode"
          secondary="Use dark appearance across the app"
          checked={darkMode}
          onChange={(e) => {
            const next = e.target.checked;
            setMode(next ? 'dark' : 'light');
            writeDarkModePreference(next);
          }}
        />
      </GroupedListSection>

      <GroupedListSection title="Notifications">
        <GroupedSwitchRow
          label="Session emails"
          secondary="Email notifications for charging sessions"
          checked={notifications}
          onChange={(e) => setNotifications(e.target.checked)}
        />
      </GroupedListSection>

      <Button
        variant="contained"
        disableElevation
        startIcon={<SaveIcon />}
        onClick={handleSave}
        sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), width: { xs: '100%', sm: 'auto' } })}
      >
        Save preferences
      </Button>
    </Box>
  );
}
