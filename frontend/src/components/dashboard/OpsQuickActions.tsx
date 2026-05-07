import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Grid, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import SpeedIcon from '@mui/icons-material/Speed';
import HistoryIcon from '@mui/icons-material/History';
import EvStationIcon from '@mui/icons-material/EvStation';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import { getOpsNavPaths } from '../../config/opsNav.paths';
import { QuickActionTile } from './QuickActionTile';

interface OpsAction {
  path: string;
  label: string;
  shortLabel: string;
  ariaLabel: string;
  Icon: SvgIconComponent;
}

function buildOpsActions(pathname: string, paths: ReturnType<typeof getOpsNavPaths>): OpsAction[] {
  const isSuper = pathname.startsWith('/superadmin');
  const homeLabel = isSuper ? 'Super Admin home' : 'Admin home';
  const homeAria = isSuper ? 'Open Super Admin dashboard' : 'Open Admin dashboard';

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
      label: homeLabel,
      shortLabel: 'Home',
      ariaLabel: homeAria,
      Icon: SpaceDashboardIcon,
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
  const actions = buildOpsActions(pathname, getOpsNavPaths(pathname));

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
          <Grid item xs={6} sm={3} key={action.path}>
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
