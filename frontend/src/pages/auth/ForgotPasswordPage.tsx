import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Collapse,
} from '@mui/material';
import { authApi } from '../../services/authApi';
import { AuthBrandHeader } from '../../components/auth/AuthBrandHeader';
import { authPagePaperSx, authPageRootSx, authPageTitleSx } from '../../styles/authShell';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [requestDone, setRequestDone] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoadingRequest(true);
    try {
      const res = await authApi.requestPasswordReset(email.trim());
      setInfo(res.message);
      setRequestDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not process request.');
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoadingReset(true);
    try {
      const res = await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        password,
      });
      setInfo(res.message);
      setTimeout(() => navigate('/login/user', { replace: true }), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Reset failed.');
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <Box sx={authPageRootSx}>
      <Container maxWidth="xs" disableGutters sx={{ width: '100%' }}>
        <Paper elevation={0} sx={authPagePaperSx}>
          <AuthBrandHeader />
          <Typography component="h1" variant="subtitle1" sx={authPageTitleSx}>
            Reset password
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Reset tokens are issued for your email. In development, the server logs the token. Production should email
            this token to the user.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 1.5, py: 0 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {info && (
            <Alert severity="success" sx={{ mb: 1.5, py: 0 }} onClose={() => setInfo(null)}>
              {info}
            </Alert>
          )}

          <Box component="form" onSubmit={handleRequest}>
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
            <Button type="submit" fullWidth variant="contained" size="medium" disabled={loadingRequest}>
              {loadingRequest ? 'Sending…' : 'Request reset token'}
            </Button>
          </Box>

          <Collapse in={requestDone}>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.75 }}>
              Complete reset
            </Typography>
            <Box component="form" onSubmit={handleReset}>
              <TextField
                fullWidth
                size="small"
                label="Reset token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                margin="none"
                sx={{ mb: 1.25 }}
                required
                autoComplete="off"
                helperText="From server log (dev) or email (production)."
              />
              <TextField
                fullWidth
                size="small"
                label="New password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="none"
                required
                autoComplete="new-password"
                inputProps={{ minLength: 8 }}
                helperText="At least 8 characters."
              />
              <Button type="submit" fullWidth variant="outlined" size="medium" sx={{ mt: 1.5 }} disabled={loadingReset}>
                {loadingReset ? 'Updating…' : 'Set new password'}
              </Button>
            </Box>
          </Collapse>

          <Box sx={{ mt: 1.5, textAlign: 'center' }}>
            <Link component={RouterLink} to="/login/user" variant="caption" sx={{ textDecoration: 'none' }}>
              Back to sign in
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
