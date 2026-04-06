import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Grid, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import SpeedIcon from '@mui/icons-material/Speed';
import HistoryIcon from '@mui/icons-material/History';
import EvStationIcon from '@mui/icons-material/EvStation';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PeopleIcon from '@mui/icons-material/People';
import { getOpsNavPaths } from '../../config/opsNav.paths';
import { QuickActionTile } from './QuickActionTile';

interface OpsAction {
  path: string;
  label: string;
  shortLabel: string;
  ariaLabel: string;
  Icon: SvgIconComponent;
}

function buildOpsActions(paths: ReturnType<typeof getOpsNavPaths>): OpsAction[] {
  return [
    {
      path: paths.opsBase,
      label: 'Operations',
      shortLabel: 'Ops',
      ariaLabel: 'Operations dashboard',
      Icon: SpeedIcon,
    },
    {
      path: `${paths.opsBase}/sessions`,
      label: 'Sessions',
      shortLabel: 'Sessions',
      ariaLabel: 'All charging sessions',
      Icon: HistoryIcon,
    },
    {
      path: `${paths.opsBase}/devices`,
      label: 'Devices',
      shortLabel: 'Devices',
      ariaLabel: 'Charge points and devices',
      Icon: EvStationIcon,
    },
    {
      path: paths.mainDashboard,
      label: 'Admin home',
      shortLabel: 'Home',
      ariaLabel: 'Main admin dashboard',
      Icon: SpaceDashboardIcon,
    },
    {
      path: paths.wallets,
      label: 'Wallets',
      shortLabel: 'Wallets',
      ariaLabel: 'Wallet management',
      Icon: AccountBalanceWalletIcon,
    },
    {
      path: paths.users,
      label: 'Users',
      shortLabel: 'Users',
      ariaLabel: 'User management',
      Icon: PeopleIcon,
    },
  ];
}

export interface OpsQuickActionsProps {
  sectionLabel?: string;
}

export function OpsQuickActions({ sectionLabel = 'Shortcuts' }: OpsQuickActionsProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobileNav = useMediaQuery(theme.breakpoints.down('sm'));
  const actions = buildOpsActions(getOpsNavPaths(pathname));

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 1, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
      >
        {sectionLabel}
      </Typography>
      <Grid container spacing={{ xs: 1.25, sm: 1.5 }} sx={{ mb: 2 }}>
        {actions.map((action) => (
          <Grid item xs={6} sm={4} md={2} key={action.path}>
            <QuickActionTile
              Icon={action.Icon}
              displayLabel={isMobileNav ? action.shortLabel : action.label}
              ariaLabel={action.ariaLabel}
              onNavigate={() => navigate(action.path)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
