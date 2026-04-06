import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx } from '../../theme/jampackShell';
import { authFormFieldSx, compactContainedCtaSx, sxObject } from '../../styles/authShell';

const PREF_KEYS = {
  currency: 'user_pref_currency',
  notifications: 'user_pref_notifications',
  darkMode: 'user_pref_dark_mode',
};

export function CustomerPreferencesPage() {
  const [currency, setCurrency] = useState('GHS');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrency(localStorage.getItem(PREF_KEYS.currency) || 'GHS');
    setNotifications(localStorage.getItem(PREF_KEYS.notifications) !== 'false');
    setDarkMode(localStorage.getItem(PREF_KEYS.darkMode) === 'true');
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(PREF_KEYS.currency, currency);
      localStorage.setItem(PREF_KEYS.notifications, String(notifications));
      localStorage.setItem(PREF_KEYS.darkMode, String(darkMode));
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError('Failed to save preferences');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
          Preferences
        </Typography>
        <Typography variant="body2" sx={dashboardPageSubtitleSx}>
          Customize your experience
        </Typography>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSaved(false)}>
          Preferences saved successfully
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={premiumPanelCardSx}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Display
        </Typography>
        <FormControl
          fullWidth
          sx={(th) => ({
            ...sxObject(th, authFormFieldSx),
            mb: 3,
            mt: 1,
          })}
        >
          <InputLabel>Currency</InputLabel>
          <Select value={currency} label="Currency" onChange={(e) => setCurrency(e.target.value)}>
            <MenuItem value="GHS">GHS (Ghana Cedis)</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />}
          label="Dark mode (coming soon)"
          sx={{ display: 'flex', alignItems: 'center', mb: 2, ml: 0 }}
        />

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
          Notifications
        </Typography>
        <FormControlLabel
          control={<Switch checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />}
          label="Email notifications for charging sessions"
          sx={{ display: 'flex', alignItems: 'center', ml: 0 }}
        />

        <Button
          variant="contained"
          disableElevation
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), mt: 3, width: { xs: '100%', sm: 'auto' } })}
        >
          Save preferences
        </Button>
      </Paper>
    </Box>
  );
}
