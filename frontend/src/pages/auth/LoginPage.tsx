import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Tabs,
  Tab,
} from '@mui/material';
import { authApi } from '../../services/authApi';
import { AuthBrandHeader } from '../../components/auth/AuthBrandHeader';
import { authPagePaperSx, authPageRootSx, authPageTitleSx } from '../../styles/authShell';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`login-tabpanel-${index}`} aria-labelledby={`login-tab-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 1.25 }}>{children}</Box>}
    </div>
  );
}

export function LoginPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login(emailOrPhone, password);
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      if (response.user.accountType === 'SuperAdmin') {
        window.location.href = '/superadmin/dashboard';
      } else if (response.user.accountType === 'Admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/user/dashboard';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={authPageRootSx}>
      <Container maxWidth="xs" disableGutters sx={{ width: '100%' }}>
        <Paper elevation={0} sx={authPagePaperSx}>
          <AuthBrandHeader />
          <Typography component="h1" variant="subtitle1" sx={authPageTitleSx}>
            Sign in
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 1.5, py: 0 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Tabs
            value={activeTab}
            onChange={(_e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              minHeight: 40,
              borderBottom: 1,
              borderColor: 'divider',
              mb: 0.5,
              '& .MuiTab-root': {
                minHeight: 40,
                py: 0.5,
                px: 0.25,
                fontSize: '0.7rem',
                textTransform: 'none',
              },
            }}
          >
            <Tab label="Super admin" id="login-tab-0" aria-controls="login-tabpanel-0" />
            <Tab label="Admin" id="login-tab-1" aria-controls="login-tabpanel-1" />
            <Tab label="User" id="login-tab-2" aria-controls="login-tabpanel-2" />
          </Tabs>

          <form onSubmit={handleLogin}>
            <TabPanel value={activeTab} index={0}>
              <TextField
                fullWidth
                size="small"
                label="Email"
                type="email"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                margin="none"
                sx={{ mb: 1.25 }}
                required
                autoComplete="email"
                autoFocus
              />
              <TextField
                fullWidth
                size="small"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="none"
                required
                autoComplete="current-password"
              />
              <Button type="submit" fullWidth variant="contained" size="medium" sx={{ mt: 1.5 }} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <TextField
                fullWidth
                size="small"
                label="Email"
                type="email"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                margin="none"
                sx={{ mb: 1.25 }}
                required
                autoComplete="email"
                autoFocus
              />
              <TextField
                fullWidth
                size="small"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="none"
                required
                autoComplete="current-password"
              />
              <Button type="submit" fullWidth variant="contained" size="medium" sx={{ mt: 1.5 }} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <TextField
                fullWidth
                size="small"
                label="Email or phone number"
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                margin="none"
                sx={{ mb: 1.25 }}
                required
                autoComplete="username"
                autoFocus
                helperText="Use your registered email or phone number."
              />
              <TextField
                fullWidth
                size="small"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="none"
                required
                autoComplete="current-password"
              />
              <Button type="submit" fullWidth variant="contained" size="medium" sx={{ mt: 1.5 }} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Link component={RouterLink} to="/forgot-password" variant="caption" sx={{ textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </Box>
            </TabPanel>
          </form>

          <Box sx={{ mt: 1.5, textAlign: 'center' }}>
            <Link component={RouterLink} to="/register" variant="caption" sx={{ textDecoration: 'none' }}>
              Create account
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
