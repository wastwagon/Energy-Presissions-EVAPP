import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { chargePointsApi, ChargePoint } from '../services/chargePointsApi';
import { vendorApi, Vendor } from '../services/vendorApi';
import { api } from '../services/api';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactOutlinedCtaSx,
  premiumDialogPaperSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../styles/authShell';

interface ChargePointSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  chargePoint: ChargePoint | null;
  onSave: () => void;
}

export function ChargePointSettingsDialog({
  open,
  onClose,
  chargePoint,
  onSave,
}: ChargePointSettingsDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [locatingDevice, setLocatingDevice] = useState(false);

  const [formData, setFormData] = useState({
    totalCapacityKw: '',
    pricePerKwh: '',
    currency: 'GHS', // Fixed to GHS for Ghana operations
    vendorId: '',
    locationLatitude: '',
    locationLongitude: '',
    locationAddress: '',
    googleMapsUrl: '', // New field for Google Maps URL
  });

  useEffect(() => {
    if (!open) {
      setLocatingDevice(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      loadVendors();
      if (chargePoint) {
        setFormData({
          totalCapacityKw: chargePoint.totalCapacityKw?.toString() || '',
          pricePerKwh: chargePoint.pricePerKwh?.toString() || '',
          currency: chargePoint.currency || 'GHS',
          vendorId: chargePoint.vendorId?.toString() || '',
          locationLatitude: chargePoint.locationLatitude?.toString() || '',
          locationLongitude: chargePoint.locationLongitude?.toString() || '',
          locationAddress: chargePoint.locationAddress || '',
          googleMapsUrl: '', // Reset URL field when dialog opens
        });
      } else {
        // Reset form when no charge point
        setFormData({
          totalCapacityKw: '',
          pricePerKwh: '',
          currency: 'GHS',
          vendorId: '',
          locationLatitude: '',
          locationLongitude: '',
          locationAddress: '',
          googleMapsUrl: '',
        });
      }
    }
  }, [open, chargePoint]);

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const data = await vendorApi.getAll();
      setVendors(data);
    } catch (err: any) {
      console.error('Failed to load vendors:', err);
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleSave = async () => {
    if (!chargePoint) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData: any = {};

      if (formData.totalCapacityKw) {
        updateData.totalCapacityKw = parseFloat(formData.totalCapacityKw);
      }

      if (formData.pricePerKwh) {
        updateData.pricePerKwh = parseFloat(formData.pricePerKwh);
      }

      // Always set currency to GHS for Ghana operations
      updateData.currency = 'GHS';

      if (formData.vendorId) {
        updateData.vendorId = parseInt(formData.vendorId);
      }

      if (formData.locationLatitude && formData.locationLongitude) {
        updateData.locationLatitude = parseFloat(formData.locationLatitude);
        updateData.locationLongitude = parseFloat(formData.locationLongitude);
      }

      if (formData.locationAddress) {
        updateData.locationAddress = formData.locationAddress;
      }

      await chargePointsApi.update(chargePoint.chargePointId, updateData);
      setSuccess('Settings saved successfully!');
      
      // Show success message for 2 seconds before closing
      setTimeout(() => {
        onSave(); // Refresh the parent component data
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 500); // Small delay to ensure onSave completes
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenGoogleMaps = () => {
    if (formData.locationLatitude && formData.locationLongitude) {
      const url = `https://www.google.com/maps?q=${formData.locationLatitude},${formData.locationLongitude}`;
      window.open(url, '_blank');
    } else {
      setError('Please set latitude and longitude first.');
    }
  };

  const handleGetDirections = () => {
    if (formData.locationLatitude && formData.locationLongitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${formData.locationLatitude},${formData.locationLongitude}`;
      window.open(url, '_blank');
    } else {
      setError('Please set latitude and longitude first.');
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('This browser does not support GPS location. Enter coordinates manually or paste a Maps link.');
      return;
    }
    setError(null);
    setSuccess(null);
    setLocatingDevice(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFormData((prev) => ({
          ...prev,
          locationLatitude: lat.toFixed(7),
          locationLongitude: lng.toFixed(7),
        }));
        setSuccess(
          'Latitude and longitude filled from this device. Move the pin or edit values if you are not exactly at the charger, then save.',
        );
        setTimeout(() => setSuccess(null), 5000);
        setLocatingDevice(false);
      },
      (err: GeolocationPositionError) => {
        setLocatingDevice(false);
        const byCode: Record<number, string> = {
          1: 'Location permission was denied. Allow location for this site in your browser or OS settings, then try again.',
          2: 'Position could not be determined. Try outdoors or enter coordinates manually.',
          3: 'Location request timed out. Try again or enter coordinates manually.',
        };
        setError(byCode[err.code] || err.message || 'Could not read this device’s location.');
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 },
    );
  };

  /**
   * Parse Google Maps URL to extract coordinates
   * Supports multiple URL formats:
   * - https://www.google.com/maps?q=LAT,LNG
   * - https://www.google.com/maps/place/.../@LAT,LNG
   * - https://maps.app.goo.gl/... (short URL - needs resolution)
   * - https://goo.gl/maps/... (short URL - needs resolution)
   */
  const parseGoogleMapsUrl = async (url: string): Promise<{ lat: number; lng: number } | null> => {
    if (!url || !url.trim()) return null;

    // Validate URL format before parsing
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return null;
    }

    try {
      // Check if it's a short URL (goo.gl or maps.app.goo.gl)
      if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
        // For short URLs, we need to resolve them
        // Try to resolve via backend if available
        try {
          const response = await api.get(`/utils/resolve-google-maps-url`, {
            params: { url },
          });
          if (response.data && response.data.latitude && response.data.longitude) {
            return { lat: parseFloat(response.data.latitude), lng: parseFloat(response.data.longitude) };
          }
        } catch (err) {
          console.warn('Backend URL resolution not available:', err);
        }

        // If backend resolution fails, provide helpful instructions
        setError('Short URLs (goo.gl/maps.app.goo.gl) need to be resolved. Please: 1) Open the link in your browser, 2) Copy the full URL from the address bar, 3) Paste it here. Or enter coordinates manually.');
        return null;
      }

      // Parse regular Google Maps URLs
      const urlObj = new URL(trimmedUrl);

      // Format 1: ?q=LAT,LNG
      if (urlObj.searchParams.has('q')) {
        const q = urlObj.searchParams.get('q') || '';
        const coords = q.split(',');
        if (coords.length >= 2) {
          const lat = parseFloat(coords[0].trim());
          const lng = parseFloat(coords[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
          }
        }
      }

      // Format 2: /place/.../@LAT,LNG
      const placeMatch = trimmedUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (placeMatch) {
        const lat = parseFloat(placeMatch[1]);
        const lng = parseFloat(placeMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }

      // Format 3: /dir/.../destination=LAT,LNG
      const dirMatch = trimmedUrl.match(/destination=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (dirMatch) {
        const lat = parseFloat(dirMatch[1]);
        const lng = parseFloat(dirMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }

      // Format 4: /@LAT,LNG (standalone coordinates)
      const coordMatch = trimmedUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }

      return null;
    } catch (err) {
      console.error('Error parsing Google Maps URL:', err);
      return null;
    }
  };

  /**
   * Handle Google Maps URL input
   */
  const handleGoogleMapsUrlChange = async (url: string) => {
    setFormData({ ...formData, googleMapsUrl: url });
    setError(null); // Clear previous errors

    if (url && url.trim()) {
      try {
        const coords = await parseGoogleMapsUrl(url.trim());
        
        if (coords) {
          setFormData({
            ...formData,
            googleMapsUrl: url,
            locationLatitude: coords.lat.toString(),
            locationLongitude: coords.lng.toString(),
          });
          setSuccess(`Coordinates extracted: ${coords.lat}, ${coords.lng}`);
          setTimeout(() => setSuccess(null), 3000);
        } else if (!url.includes('goo.gl') && !url.includes('maps.app.goo.gl')) {
          // Only show error if it's not a short URL (we handle that separately)
          setError('Could not extract coordinates from URL. Please check the URL format or enter coordinates manually.');
        }
      } catch (err) {
        // Silently handle parsing errors - don't show error for empty/invalid URLs
        console.warn('URL parsing error (non-critical):', err);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            Charge Point Settings
          </Typography>
          <IconButton
            onClick={onClose}
            aria-label="Close charge point settings dialog"
            sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        {chargePoint && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {chargePoint.chargePointId}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 1 }}>
          {/* Capacity Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Capacity
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Total Capacity (kW)"
              type="number"
              fullWidth
              value={formData.totalCapacityKw}
              onChange={(e) => setFormData({ ...formData, totalCapacityKw: e.target.value })}
              helperText="Total charging capacity in kilowatts"
              InputProps={{
                endAdornment: <InputAdornment position="end">kW</InputAdornment>,
              }}
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Grid>

          {/* Pricing Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Pricing
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Price per kWh"
              type="number"
              fullWidth
              value={formData.pricePerKwh}
              onChange={(e) => setFormData({ ...formData, pricePerKwh: e.target.value })}
              helperText="Price per kilowatt-hour in GHS (overrides tariff if set)"
              InputProps={{
                startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
              }}
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Grid>

          {/* Vendor Assignment */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Vendor Assignment
            </Typography>
          </Grid>
          <Grid item xs={12}>
            {loadingVendors ? (
              <CircularProgress size={24} />
            ) : (
              <TextField
                label="Assign to Vendor"
                select
                fullWidth
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                helperText="Select the vendor that owns/manages this charge point"
                sx={(th) => sxObject(th, authFormFieldSx)}
              >
                {vendors.map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.id.toString()}>
                    {vendor.name} {vendor.status !== 'active' && `(${vendor.status})`}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Grid>

          {/* Location Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Location
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Button
              type="button"
              variant="outlined"
              startIcon={
                locatingDevice ? <CircularProgress size={18} color="inherit" /> : <MyLocationIcon />
              }
              onClick={handleUseMyLocation}
              disabled={locatingDevice}
              aria-label="Use this device GPS to fill latitude and longitude"
              sx={(th) => ({
                ...sxObject(th, compactOutlinedCtaSx),
                width: { xs: '100%', sm: 'auto' },
                minHeight: 44,
              })}
            >
              {locatingDevice ? 'Getting location…' : 'Use this device’s location'}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, maxWidth: 'sm' }}>
              Fills latitude and longitude from your phone or laptop when you allow location. Stand at the charger for
              best results, then adjust if needed.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Google Maps URL"
              fullWidth
              value={formData.googleMapsUrl}
              onChange={(e) => handleGoogleMapsUrlChange(e.target.value)}
              placeholder="Paste Google Maps link (e.g., https://maps.app.goo.gl/... or https://www.google.com/maps?q=...)"
              helperText="Paste a Google Maps link to automatically extract coordinates"
              InputProps={{
                startAdornment: <InputAdornment position="start"><LocationOnIcon color="action" /></InputAdornment>,
              }}
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={2}
              value={formData.locationAddress}
              onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
              helperText="Full address of the charge station"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Latitude"
              type="number"
              fullWidth
              value={formData.locationLatitude}
              onChange={(e) => setFormData({ ...formData, locationLatitude: e.target.value })}
              helperText="GPS latitude coordinate"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Longitude"
              type="number"
              fullWidth
              value={formData.locationLongitude}
              onChange={(e) => setFormData({ ...formData, locationLongitude: e.target.value })}
              helperText="GPS longitude coordinate"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mt: 1 }}>
              <Button
                variant="outlined"
                startIcon={<LocationOnIcon />}
                onClick={handleOpenGoogleMaps}
                disabled={!formData.locationLatitude || !formData.locationLongitude}
                title={!formData.locationLatitude || !formData.locationLongitude ? "Please enter latitude and longitude first" : "View location on Google Maps"}
                sx={(th) => ({
                  ...sxObject(th, compactOutlinedCtaSx),
                  width: { xs: '100%', sm: 'auto' },
                })}
              >
                View on Google Maps
              </Button>
              <Button
                variant="outlined"
                onClick={handleGetDirections}
                disabled={!formData.locationLatitude || !formData.locationLongitude}
                title={!formData.locationLatitude || !formData.locationLongitude ? "Please enter latitude and longitude first" : "Get directions to this location"}
                sx={(th) => ({
                  ...sxObject(th, compactOutlinedCtaSx),
                  width: { xs: '100%', sm: 'auto' },
                })}
              >
                Get Directions
              </Button>
            </Box>
            {(!formData.locationLatitude || !formData.locationLongitude) && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Enter latitude and longitude to enable Google Maps features
              </Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disableElevation
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          disabled={saving}
          sx={(th) => sxObject(th, compactContainedCtaSx)}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
}
