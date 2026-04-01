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
import { AuthBrandHeader } from '../../components/auth/AuthBrandHeader';
import { authPagePaperSx, authPageRootSx, authPageTitleSx } from '../../styles/authShell';
import { redirectAfterLogin } from '../../utils/redirectAfterLogin';

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: object) => Promise<void>;
        signIn: (config?: object) => Promise<{
          authorization: { id_token: string };
          user?: { name?: { firstName?: string; lastName?: string }; email?: string };
        }>;
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

/**
 * Unified sign-in for all roles. Email/phone + password, or Google / Apple.
 * Redirects by `accountType` from the API.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const successMessage = (location.state as { message?: string })?.message;
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resolvePostLoginPath = useCallback(
    (accountType: string) => {
      const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      const returnToStationId = sessionStorage.getItem('returnToStation');
      const targetPath = redirectAfterLogin(accountType, { fromPath, returnToStationId });
      if (returnToStationId) {
        sessionStorage.removeItem('returnToStation');
      }
      return targetPath;
    },
    [location.state],
  );

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const phoneParam = searchParams.get('phone');
    if (emailParam) setEmailOrPhone(emailParam);
    else if (phoneParam) setEmailOrPhone(phoneParam);
  }, [searchParams]);

  useEffect(() => {
    if (document.getElementById('appleid-signin-script')) return;
    const script = document.createElement('script');
    script.id = 'appleid-signin-script';
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [googleReady, setGoogleReady] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login(emailOrPhone, password);
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate(resolvePostLoginPath(response.user.accountType), { replace: true });
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
      navigate(resolvePostLoginPath(data.user.accountType), { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Sign in with Google failed. Please try email/password.');
    } finally {
      setLoading(false);
    }
  }, [navigate, resolvePostLoginPath]);

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
      navigate(resolvePostLoginPath(data.user.accountType), { replace: true });
    } catch (err: any) {
      setError(err.message || 'Sign in with Apple failed. Please try email/password.');
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

          {successMessage && (
            <Alert
              severity="success"
              sx={{ mb: 1.5, py: 0 }}
              onClose={() => navigate('/login', { replace: true, state: {} })}
            >
              {successMessage}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 1.5, py: 0 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handlePasswordLogin}>
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
              inputMode="text"
              autoFocus
              helperText="Use the email or phone number you registered with."
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

          <Box sx={{ mt: 1.5, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Link component={RouterLink} to="/forgot-password" variant="caption" sx={{ textDecoration: 'none' }}>
              Forgot password?
            </Link>
            <Link component={RouterLink} to="/register" variant="caption" sx={{ textDecoration: 'none' }}>
              Create account
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
