import { Box, Typography, Paper } from '@mui/material';

export function StationsPage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Charging Stations
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          Station finder will be implemented here. This will show a map and list of available charging stations.
        </Typography>
      </Paper>
    </Box>
  );
}



