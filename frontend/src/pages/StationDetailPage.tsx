import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsIcon from '@mui/icons-material/Directions';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BoltIcon from '@mui/icons-material/Bolt';
import { stationsApi, StationDetails } from '../services/stationsApi';
import { StartChargingDialog } from '../components/StartChargingDialog';

export function StationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [station, setStation] = useState<StationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startChargingDialogOpen, setStartChargingDialogOpen] = useState(false);

  useEffect(() => {
    if (id) loadStation();
  }, [id]);

  const loadStation = async () => {
    if (!id) return;
    try {
      setError(null);
      const data = await stationsApi.getDetails(id);
      setStation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load station');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'success';
      case 'Charging':
      case 'Preparing':
      case 'Finishing':
        return 'info';
      case 'Offline':
        return 'default';
      default:
        return 'warning';
    }
  };

  const handleGetDirections = () => {
    if (station?.locationLatitude && station?.locationLongitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${station.locationLatitude},${station.locationLongitude}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!station || error) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/stations')} sx={{ mb: 2 }}>
          Back to Stations
        </Button>
        <Alert severity="error">{error || 'Station not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/stations')}>
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {station.locationName || station.chargePointId}
        </Typography>
        <Chip label={station.status} color={getStatusColor(station.status) as any} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Location
            </Typography>
            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocationOnIcon />
              {station.locationAddress || station.locationName || 'Address not set'}
            </Typography>
            {station.locationLatitude && station.locationLongitude && (
              <Button
                variant="outlined"
                startIcon={<DirectionsIcon />}
                onClick={handleGetDirections}
              >
                Get Directions
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Connectors
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {station.availableConnectors} of {station.totalConnectors} available
            </Typography>
            {station.connectors?.map((conn) => (
              <Box
                key={conn.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BoltIcon fontSize="small" />
                  <Typography>Connector {conn.connectorId}</Typography>
                  {conn.powerRatingKw && (
                    <Typography variant="body2" color="text.secondary">
                      {conn.powerRatingKw} kW
                    </Typography>
                  )}
                </Box>
                <Chip label={conn.status} size="small" color={getStatusColor(conn.status) as any} />
              </Box>
            ))}
          </CardContent>
        </Card>

        {station.pricePerKwh != null && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pricing
              </Typography>
              <Typography variant="h5" color="primary">
                {station.currency || 'GHS'}{' '}
                {typeof station.pricePerKwh === 'number'
                  ? station.pricePerKwh.toFixed(2)
                  : parseFloat(String(station.pricePerKwh)).toFixed(2)}{' '}
                / kWh
              </Typography>
            </CardContent>
          </Card>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrowIcon />}
          onClick={() => setStartChargingDialogOpen(true)}
          disabled={station.status === 'Offline' || station.availableConnectors === 0}
          sx={{ py: 2 }}
        >
          Start Charging
        </Button>
      </Box>

      <StartChargingDialog
        open={startChargingDialogOpen}
        onClose={() => setStartChargingDialogOpen(false)}
        station={station as any}
        onSuccess={() => loadStation()}
      />
    </Box>
  );
}
