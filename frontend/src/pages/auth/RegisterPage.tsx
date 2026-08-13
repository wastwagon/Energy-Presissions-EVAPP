import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
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
  authPageBodySx,
  authPageLinkSx,
  compactContainedCtaSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { LegalDocLink } from '../../components/legal/LegalAuthNotice';
import { getPrivacyPolicyLink, getTermsOfServiceLink } from '../../config/legal.config';
import { UserErrorAlert } from '../../components/UserErrorAlert';
import { formatUserFacingErrorMessage } from '../../utils/userFriendlyErrors';

function phoneHasMinDigits(value: string, min: number): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= min;
}

/**
 * Create account — Untitled UI light auth shell (simple mobile + split desktop).
 */
export function RegisterPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreedToLegal, setAgreedToLegal] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreedToLegal) {
      setError('Agree to the Terms of Service and Privacy Policy to create your account.');
      return;
    }

    if (password !== confirmPassword) {
      setError('The passwords you entered do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Choose a password with at least 6 characters.');
      return;
    }
    if (!phoneHasMinDigits(phone, 8)) {
      setError('Enter a valid phone number with at least 8 digits.');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        email: email.trim(),
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone.trim(),
      });
      navigate('/login', { state: { message: 'Account created. Please sign in.' } });
    } catch (err: any) {
      setError(formatUserFacingErrorMessage(err, 'auth'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      mode="register"
      title="Create an account"
      subtitle="Start charging with Energy Presissions."
      footer={
        <Typography component="p" sx={{ ...authPageBodySx, m: 0 }}>
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" sx={{ ...authPageLinkSx, fontWeight: 600 }}>
            Log in
          </Link>
        </Typography>
      }
    >
      {error && (
        <UserErrorAlert error={error} context="auth" sx={{ mb: 2 }} onClose={() => setError(null)} />
      )}

      <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              sx={authFormFieldSx}
              required
              autoComplete="given-name"
              autoFocus
            />
            <TextField
              fullWidth
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              sx={authFormFieldSx}
              required
              autoComplete="family-name"
            />
          </Box>
          <TextField
            fullWidth
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            sx={authFormFieldSx}
            required
            autoComplete="tel"
            inputMode="tel"
            helperText="Ghana: e.g. 024 000 0000 or +233 24 000 0000"
          />
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
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            sx={authFormFieldSx}
            required
            autoComplete="new-password"
            helperText="Must be at least 6 characters"
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
          <TextField
            fullWidth
            label="Confirm password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            sx={authFormFieldSx}
            required
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    sx={{
                      ...sxObject(theme, premiumIconButtonTouchSx),
                      color: 'text.secondary',
                    }}
                  >
                    {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControlLabel
            sx={{ alignItems: 'flex-start', m: 0 }}
            control={
              <Checkbox
                checked={agreedToLegal}
                onChange={(_, checked) => setAgreedToLegal(checked)}
                size="small"
                sx={{ pt: 0.25 }}
              />
            }
            label={
              <Typography variant="body2" sx={authPageBodySx}>
                I agree to the{' '}
                <LegalDocLink label="Terms of Service" {...getTermsOfServiceLink()} /> and{' '}
                <LegalDocLink label="Privacy Policy" {...getPrivacyPolicyLink()} />.
              </Typography>
            }
          />
        </Box>

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
          {loading ? 'Creating account…' : 'Get started'}
        </Button>
      </Box>
    </AuthSplitLayout>
  );
}
