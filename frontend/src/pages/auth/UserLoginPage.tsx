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
    window.google!.accounts.id.renderButton(el, {
      type: 'standard',
      theme: 'outlined',
      size: 'medium',
      text: 'continue_with',
      width: 240,
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
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        backgroundImage: 'linear-gradient(135deg, #0A3D62 0%, #1A5F7A 100%)',
        py: 2,
        paddingTop: 'max(env(safe-area-inset-top), 8px)',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
              <img 
                src="/logo.jpeg" 
                alt="Clean Motion Ghana" 
                style={{ height: 'clamp(48px, 15vw, 60px)', objectFit: 'contain' }}
              />
            </Box>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1.35rem', sm: '1.5rem' } }}>
              User Login
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clean Motion Ghana
            </Typography>
          </Box>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => navigate('/login/user', { replace: true, state: {} })}>
              {successMessage}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="dense"
              required
              autoComplete="email"
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="dense"
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Divider sx={{ my: 2 }}>or</Divider>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
              {googleClientId && (
                <Box
                  ref={googleButtonRef}
                  sx={{
                    width: 240,
                    minHeight: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    '& iframe': { minHeight: 40 },
                  }}
                />
              )}
              <Button
                variant="outlined"
                size="medium"
                onClick={handleAppleSignIn}
                disabled={loading}
                sx={{
                  width: 240,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  borderColor: 'text.primary',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Box component="span" sx={{ mr: 1.25, display: 'inline-flex', alignItems: 'center' }}>
                  <img src="/apple-logo.svg" alt="" width={18} height={18} style={{ display: 'block' }} />
                </Box>
                Sign in with Apple
              </Button>
            </Box>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link
              component={RouterLink}
              to="/register"
              variant="body2"
              sx={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              Don't have an account? Sign up
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

