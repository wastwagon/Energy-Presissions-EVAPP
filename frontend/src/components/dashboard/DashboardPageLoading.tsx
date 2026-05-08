import { Box } from '@mui/material';
import { mobileMainLayoutBottomMarginSx } from '../../theme/jampackShell';
import { CustomerChromeSkeleton } from './CustomerChromeSkeleton';

/** Charging hub placeholder (light shell, aligned with `CustomerChargingPage`). */
export function DashboardPageLoading() {
  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden', ...mobileMainLayoutBottomMarginSx }}>
      <CustomerChromeSkeleton preset="chargingHub" />
    </Box>
  );
}
