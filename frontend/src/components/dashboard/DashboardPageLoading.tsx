import { Box } from '@mui/material';
import { mobileMainLayoutBottomMarginSx } from '../../theme/jampackShell';
import { CustomerChromeSkeleton } from './CustomerChromeSkeleton';

/** Full-width charging-hub placeholder (matches `CustomerChargingPage` chrome). */
export function DashboardPageLoading() {
  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden', ...mobileMainLayoutBottomMarginSx }}>
      <CustomerChromeSkeleton preset="chargingHub" />
    </Box>
  );
}
