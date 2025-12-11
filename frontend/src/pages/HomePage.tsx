import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import EvStationIcon from '@mui/icons-material/EvStation';

export function HomePage() {
  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to EV Charging Billing System
      </Typography>
      <Typography variant="h6" color="text.secondary" paragraph>
        Manage your EV charging operations and billing
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <EvStationIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Find Stations
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Locate nearby charging stations
            </Typography>
            <Button component={Link} to="/stations" variant="contained">
              View Stations
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <EvStationIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Operations
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Monitor and manage charging operations
            </Typography>
            <Button component={Link} to="/ops" variant="contained">
              Operations Dashboard
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <EvStationIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Admin
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              System administration and configuration
            </Typography>
            <Button component={Link} to="/admin" variant="contained">
              Admin Dashboard
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}



