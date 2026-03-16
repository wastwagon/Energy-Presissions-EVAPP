import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { authApi } from '../../services/authApi';

export function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill email if provided in URL
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login(email, password);
      
      // Verify it's a SuperAdmin
      if (response.user.accountType !== 'SuperAdmin') {
        setError('This login is for Super Admin only. Please use the appropriate login page.');
        setLoading(false);
        return;
      }
      
          // Store token and user info
          localStorage.setItem('token', response.accessToken);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Use window.location for a full page reload to ensure proper initialization
          // Redirect to Super Admin dashboard
          window.location.href = '/superadmin/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        backgroundImage: 'linear-gradient(135deg, #062540 0%, #0A3D62 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <img 
                src="/newlog.png" 
                alt="Clean Motion Ghana" 
                style={{ height: '60px', objectFit: 'contain' }}
              />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'error.main' }}>
              Super Admin Login
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clean Motion Ghana
            </Typography>
          </Box>

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
              margin="normal"
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
              margin="normal"
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              color="primary"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In as Super Admin'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Need a different login?{' '}
              <Button
                size="small"
                onClick={() => navigate('/login/admin')}
                sx={{ textTransform: 'none' }}
              >
                Admin Login
              </Button>
              {' or '}
              <Button
                size="small"
                onClick={() => navigate('/login/user')}
                sx={{ textTransform: 'none' }}
              >
                User Login
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

