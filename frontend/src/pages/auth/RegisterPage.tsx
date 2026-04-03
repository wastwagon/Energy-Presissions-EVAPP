import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { authApi } from '../../services/authApi';
import { AuthBrandHeader } from '../../components/auth/AuthBrandHeader';
import { authPagePaperSx, authPageRootSx, authPageTitleSx } from '../../styles/authShell';
import { LegalDocLink, LegalFooterLinks } from '../../components/legal/LegalAuthNotice';
import { getPrivacyPolicyLink, getTermsOfServiceLink } from '../../config/legal.config';

function phoneHasMinDigits(value: string, min: number): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= min;
}

export function RegisterPage() {
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
      setError('Please agree to the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!phoneHasMinDigits(phone, 8)) {
      setError('Please enter a valid phone number (at least 8 digits).');
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
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
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
            Create account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 1.5, py: 0 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleRegister}>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                fullWidth
                size="small"
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                margin="none"
                required
                autoComplete="given-name"
              />
              <TextField
                fullWidth
                size="small"
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                margin="none"
                required
                autoComplete="family-name"
              />
            </Box>
            <TextField
              fullWidth
              size="small"
              label="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              margin="none"
              sx={{ mt: 1.25 }}
              required
              autoComplete="tel"
              inputMode="tel"
              helperText="Required. Ghana: e.g. 024 000 0000 or +233 24 000 0000"
            />
            <TextField
              fullWidth
              size="small"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="none"
              sx={{ mt: 1.25 }}
              required
              autoComplete="email"
            />
            <TextField
              fullWidth
              size="small"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="none"
              sx={{ mt: 1.25 }}
              required
              autoComplete="new-password"
              helperText="Min. 6 characters"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              size="small"
              label="Confirm password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="none"
              sx={{ mt: 1.25 }}
              required
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControlLabel
              sx={{ alignItems: 'flex-start', mt: 1.25, mr: 0 }}
              control={
                <Checkbox
                  checked={agreedToLegal}
                  onChange={(_, checked) => setAgreedToLegal(checked)}
                  size="small"
                  sx={{ pt: 0.25 }}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                  I agree to the{' '}
                  <LegalDocLink
                    label="Terms of Service"
                    {...getTermsOfServiceLink()}
                  />{' '}
                  and{' '}
                  <LegalDocLink
                    label="Privacy Policy"
                    {...getPrivacyPolicyLink()}
                  />
                  .
                </Typography>
              }
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="medium"
              sx={{ mt: 1.5 }}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </form>

          <Box sx={{ mt: 1.5, textAlign: 'center' }}>
            <Link
              component={RouterLink}
              to="/login"
              variant="caption"
              sx={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              Sign in instead
            </Link>
          </Box>

          <LegalFooterLinks />
        </Paper>
      </Container>
    </Box>
  );
}
