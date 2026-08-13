import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  useTheme,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { authApi } from '../../services/authApi';
import { AuthSplitLayout } from '../../components/auth/AuthSplitLayout';
import {
  authFormFieldSx,
  authPageLinkSx,
  authPageBodySx,
  compactContainedCtaSx,
  compactOutlinedCtaSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { redirectAfterLogin } from '../../utils/redirectAfterLogin';
import { LegalAuthNotice } from '../../components/legal/LegalAuthNotice';
import { UserErrorAlert } from '../../components/UserErrorAlert';
import { formatUserFacingErrorMessage } from '../../utils/userFriendlyErrors';

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
 * Unified sign-in — Untitled UI light auth shell (simple mobile + split desktop).
 */
export function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const successMessage = (location.state as { message?: string })?.message;
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
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
      if (remember) {
        localStorage.setItem('authRemember', '1');
      } else {
        localStorage.removeItem('authRemember');
      }
      navigate(resolvePostLoginPath(response.user.accountType), { replace: true });
    } catch (err: any) {
      setError(formatUserFacingErrorMessage(err, 'auth'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setError(null);
      setLoading(true);
      try {
        const data = await authApi.googleSignIn(credential);
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate(resolvePostLoginPath(data.user.accountType), { replace: true });
      } catch (err: any) {
        setError(formatUserFacingErrorMessage(err, 'auth'));
      } finally {
        setLoading(false);
      }
    },
    [navigate, resolvePostLoginPath],
  );

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
    const btnWidth = Math.min(360, Math.max(240, el.offsetWidth || 280));
    window.google!.accounts.id.renderButton(el, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      width: btnWidth,
    });
  }, [googleReady, googleClientId, handleGoogleCredential]);

  const handleAppleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!window.AppleID) {
        setError('Sign in with Apple is still loading. Wait a moment and try again.');
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
        setError('Sign in with Apple was cancelled. Try again or use email and password.');
        setLoading(false);
        return;
      }
      const data = await authApi.appleSignIn(idToken, response.user);
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(resolvePostLoginPath(data.user.accountType), { replace: true });
    } catch (err: any) {
      setError(formatUserFacingErrorMessage(err, 'auth'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      mode="login"
      title="Log in to your account"
      subtitle="Welcome back! Please enter your details."
      footer={
        <Typography component="p" sx={{ ...authPageBodySx, m: 0 }}>
          Don&apos;t have an account?{' '}
          <Link component={RouterLink} to="/register" sx={{ ...authPageLinkSx, fontWeight: 600 }}>
            Sign up
          </Link>
        </Typography>
      }
    >
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => navigate('/login', { replace: true, state: {} })}
        >
          {successMessage}
        </Alert>
      )}
      {error && (
        <UserErrorAlert error={error} context="auth" sx={{ mb: 2 }} onClose={() => setError(null)} />
      )}

      <Box component="form" onSubmit={handlePasswordLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Email or phone"
            type="text"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            placeholder="Enter your email or phone"
            sx={authFormFieldSx}
            required
            autoComplete="username"
            inputMode="text"
            autoFocus
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            sx={authFormFieldSx}
            required
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    sx={{
                      ...sxObject(theme, premiumIconButtonTouchSx),
                      color: 'text.secondary',
                    }}
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <FormControlLabel
            sx={{ m: 0 }}
            control={
              <Checkbox
                checked={remember}
                onChange={(_, checked) => setRemember(checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                Remember for 30 days
              </Typography>
            }
          />
          <Link component={RouterLink} to="/forgot-password" sx={{ ...authPageLinkSx, fontWeight: 600 }}>
            Forgot password
          </Link>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disableElevation
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              width: '100%',
              minHeight: 48,
              fontSize: '1rem',
            })}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>

          {googleClientId && (
            <Box
              ref={googleButtonRef}
              sx={{
                width: '100%',
                minHeight: 44,
                display: 'flex',
                justifyContent: 'center',
                '& iframe': { minHeight: 44 },
              }}
            />
          )}

          <Button
            variant="outlined"
            onClick={handleAppleSignIn}
            disabled={loading}
            fullWidth
            sx={(th) => ({
              ...sxObject(th, compactOutlinedCtaSx),
              minHeight: 48,
              borderColor: 'divider',
              color: 'text.primary',
              fontWeight: 600,
            })}
          >
            <Box component="span" sx={{ mr: 1, display: 'inline-flex', alignItems: 'center' }}>
              <img src="/apple-logo.svg" alt="" width={18} height={18} style={{ display: 'block' }} />
            </Box>
            Sign in with Apple
          </Button>
        </Box>

        <LegalAuthNotice includeAppleDisclosure />
      </Box>
    </AuthSplitLayout>
  );
}
