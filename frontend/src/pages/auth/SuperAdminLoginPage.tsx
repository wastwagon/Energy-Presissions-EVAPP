import { useState, useEffect } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
} from '@mui/material';
import { authApi } from '../../services/authApi';
import { AuthBrandHeader } from '../../components/auth/AuthBrandHeader';
import { authPagePaperSx, authPageRootSx, authPageTitleSx } from '../../styles/authShell';

export function SuperAdminLoginPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login(email, password);

      if (response.user.accountType !== 'SuperAdmin') {
        setError('This login is for Super Admin only. Please use the appropriate login page.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      window.location.href = '/superadmin/dashboard';
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
            Super admin
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 1.5, py: 0 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              size="small"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="medium"
              color="primary"
              sx={{ mt: 1.5 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <Box sx={{ mt: 1.5, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.6 }}>
              <Link component={RouterLink} to="/login/admin" variant="caption" underline="hover">
                Admin
              </Link>
              {' · '}
              <Link component={RouterLink} to="/login/user" variant="caption" underline="hover">
                User
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
