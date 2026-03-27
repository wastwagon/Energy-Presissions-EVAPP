import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Divider,
} from '@mui/material';
import { authApi } from '../../services/authApi';

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: object) => Promise<void>;
        signIn: (config?: object) => Promise<{ authorization: { id_token: string }; user?: { name?: { firstName?: string; lastName?: string }; email?: string } }>;
      };
    };
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (res: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export function UserLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const successMessage = (location.state as { message?: string })?.message;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  // Load Sign in with Apple JS SDK
  useEffect(() => {
    if (document.getElementById('appleid-signin-script')) return;
    const script = document.createElement('script');
    script.id = 'appleid-signin-script';
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Load and initialize Google Identity Services
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [googleReady, setGoogleReady] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login(email, password);
      
      // Verify it's a Customer (not Admin or SuperAdmin)
      if (response.user.accountType === 'Admin' || response.user.accountType === 'SuperAdmin') {
        setError('This login is for customers only. Please use the admin login page.');
        setLoading(false);
        return;
      }
      
      // Store token and user info
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Use window.location for a full page reload to ensure proper initialization
      // Redirect to User dashboard
      window.location.href = '/user/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authApi.googleSignIn(credential);
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/user/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Sign in with Google failed. Please try email/password.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!googleClientId) return;
    if (document.getElementById('google-gsi-script')) {
      const check = () => {
        if (window.google?.accounts?.id) setGoogleReady(true);
        else setTimeout(check, 100);
      };
      check();
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    document.head.appendChild(script);
  }, [googleClientId]);

  const googleButtonRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!googleReady || !googleClientId || !googleButtonRef.current) return;
    const el = googleButtonRef.current;
    if (el.querySelector('[role="button"]')) return;
    window.google!.accounts.id.initialize({
      client_id: googleClientId,
      callback: (res) => handleGoogleCredential(res.credential),
    });
    const btnWidth = Math.min(320, Math.max(240, el.offsetWidth || 280));
    window.google!.accounts.id.renderButton(el, {
      type: 'standard',
      theme: 'outlined',
      size: 'medium',
      text: 'continue_with',
      width: btnWidth,
    });
  }, [googleReady, googleClientId, handleGoogleCredential]);

  const handleAppleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!window.AppleID) {
        setError('Sign in with Apple is loading. Please try again in a moment.');
        setLoading(false);
        return;
      }
      const baseUrl = window.location.origin;
      await window.AppleID.auth.init({
        clientId: 'com.energyprecisions.cleanmotion.signin',
        scope: 'name email',
        redirectURI: `${baseUrl}/auth/apple/callback`,
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      const idToken = response.authorization?.id_token;
      if (!idToken) {
        setError('Sign in with Apple was cancelled or failed.');
        setLoading(false);
        return;
      }
      const data = await authApi.appleSignIn(idToken, response.user);
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/user/dashboard';
    } catch (err: any) {
      setError(err.message || 'Sign in with Apple failed. Please try email/password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: { xs: 2, sm: 3 },
        pt: { xs: 'max(env(safe-area-inset-top), 16px)', sm: 'max(env(safe-area-inset-top), 24px)' },
        pb: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      <Container maxWidth="xs" disableGutters sx={{ width: '100%' }}>
        <Paper
          variant="outlined"
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2,
            borderColor: 'divider',
          }}
        >
          <Typography
            component="h1"
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 1.5,
              textAlign: 'center',
              letterSpacing: '0.01em',
            }}
          >
            Sign in
          </Typography>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 1.5, py: 0 }} onClose={() => navigate('/login/user', { replace: true, state: {} })}>
              {successMessage}
            </Alert>
          )}
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
              sx={{ mt: 1.5 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            <Divider sx={{ my: 1.5 }}>or</Divider>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'stretch' }}>
              {googleClientId && (
                <Box
                  ref={googleButtonRef}
                  sx={{
                    width: '100%',
                    minHeight: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    '& iframe': { minHeight: 40 },
                  }}
                />
              )}
              <Button
                variant="outlined"
                size="small"
                onClick={handleAppleSignIn}
                disabled={loading}
                fullWidth
                sx={{
                  py: 0.75,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Box component="span" sx={{ mr: 1, display: 'inline-flex', alignItems: 'center' }}>
                  <img src="/apple-logo.svg" alt="" width={16} height={16} style={{ display: 'block' }} />
                </Box>
                Sign in with Apple
              </Button>
            </Box>
          </form>

          <Box sx={{ mt: 1.5, textAlign: 'center' }}>
            <Link
              component={RouterLink}
              to="/register"
              variant="caption"
              sx={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              Create account
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

