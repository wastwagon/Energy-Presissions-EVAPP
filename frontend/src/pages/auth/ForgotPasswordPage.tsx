import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Collapse,
  IconButton,
  InputAdornment,
  useTheme,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { authApi } from '../../services/authApi';
import { AuthSplitLayout } from '../../components/auth/AuthSplitLayout';
import {
  authFormFieldSx,
  authPageBodySx,
  authPageLinkSx,
  compactContainedCtaSx,
  compactOutlinedCtaSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { UserErrorAlert } from '../../components/UserErrorAlert';
import { formatUserFacingErrorMessage } from '../../utils/userFriendlyErrors';

/**
 * Password reset — Untitled UI light auth shell (simple mobile + split desktop).
 * Step 1: request code · Step 2: enter code + new password.
 */
export function ForgotPasswordPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(formatUserFacingErrorMessage(err, 'auth'));
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
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err: any) {
      setError(formatUserFacingErrorMessage(err, 'auth'));
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <AuthSplitLayout
      hideModeTabs
      title="Forgot password?"
      subtitle={
        requestDone
          ? 'Enter the code from your email and choose a new password.'
          : "No worries, we'll send you reset instructions."
      }
      footer={
        <Typography component="p" sx={{ ...authPageBodySx, m: 0 }}>
          <Link component={RouterLink} to="/login" sx={{ ...authPageLinkSx, fontWeight: 600 }}>
            ← Back to log in
          </Link>
        </Typography>
      }
    >
      {error && (
        <UserErrorAlert error={error} context="auth" sx={{ mb: 2 }} onClose={() => setError(null)} />
      )}
      {info && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo(null)}>
          {info}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleRequest}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          sx={authFormFieldSx}
          required
          autoComplete="email"
          autoFocus
          disabled={requestDone}
        />
        {!requestDone ? (
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
            disabled={loadingRequest}
          >
            {loadingRequest ? 'Sending…' : 'Reset password'}
          </Button>
        ) : null}
      </Box>

      <Collapse in={requestDone}>
        <Box
          component="form"
          onSubmit={handleReset}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2.5 }}
        >
          <TextField
            fullWidth
            label="Reset code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter code from email"
            sx={authFormFieldSx}
            required
            autoComplete="off"
            helperText="Use the code from your email, or the one support gave you."
          />
          <TextField
            fullWidth
            label="New password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            sx={authFormFieldSx}
            required
            autoComplete="new-password"
            inputProps={{ minLength: 8 }}
            helperText="Use at least 8 characters."
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
            disabled={loadingReset}
          >
            {loadingReset ? 'Saving…' : 'Reset password'}
          </Button>
          <Button
            type="button"
            fullWidth
            variant="outlined"
            onClick={() => {
              setRequestDone(false);
              setToken('');
              setPassword('');
              setInfo(null);
              setError(null);
            }}
            sx={(th) => ({
              ...sxObject(th, compactOutlinedCtaSx),
              minHeight: 44,
              borderColor: 'divider',
              color: 'text.primary',
            })}
          >
            Use a different email
          </Button>
        </Box>
      </Collapse>
    </AuthSplitLayout>
  );
}
