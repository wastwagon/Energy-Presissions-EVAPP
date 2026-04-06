import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Paper, Grid, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import SpeedIcon from '@mui/icons-material/Speed';
import HistoryIcon from '@mui/icons-material/History';
import EvStationIcon from '@mui/icons-material/EvStation';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PeopleIcon from '@mui/icons-material/People';

interface OpsAction {
  path: string;
  label: string;
  shortLabel: string;
  ariaLabel: string;
  Icon: SvgIconComponent;
}

function useOpsShortcutActions(opsBase: string): OpsAction[] {
  const { pathname } = useLocation();
  const isSuper = pathname.startsWith('/superadmin');
  const mainDash = isSuper ? '/superadmin/dashboard' : '/admin/dashboard';
  const walletsPath = isSuper ? '/superadmin/wallets' : '/admin/wallets';
  const usersPath = isSuper ? '/superadmin/users' : '/admin/users';

  return [
    {
      path: opsBase,
      label: 'Operations',
      shortLabel: 'Ops',
      ariaLabel: 'Operations dashboard',
      Icon: SpeedIcon,
    },
    {
      path: `${opsBase}/sessions`,
      label: 'Sessions',
      shortLabel: 'Sessions',
      ariaLabel: 'All charging sessions',
      Icon: HistoryIcon,
    },
    {
      path: `${opsBase}/devices`,
      label: 'Devices',
      shortLabel: 'Devices',
      ariaLabel: 'Charge points and devices',
      Icon: EvStationIcon,
    },
    {
      path: mainDash,
      label: 'Admin home',
      shortLabel: 'Home',
      ariaLabel: 'Main admin dashboard',
      Icon: SpaceDashboardIcon,
    },
    {
      path: walletsPath,
      label: 'Wallets',
      shortLabel: 'Wallets',
      ariaLabel: 'Wallet management',
      Icon: AccountBalanceWalletIcon,
    },
    {
      path: usersPath,
      label: 'Users',
      shortLabel: 'Users',
      ariaLabel: 'User management',
      Icon: PeopleIcon,
    },
  ];
}

export interface OpsQuickActionsProps {
  opsBase: string;
  sectionLabel?: string;
}

export function OpsQuickActions({ opsBase, sectionLabel = 'Shortcuts' }: OpsQuickActionsProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobileNav = useMediaQuery(theme.breakpoints.down('sm'));
  const actions = useOpsShortcutActions(opsBase);

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
        {actions.map((action) => {
          const Icon = action.Icon;
          return (
            <Grid item xs={6} sm={4} md={2} key={action.path}>
              <Paper
                elevation={0}
                role="button"
                tabIndex={0}
                aria-label={action.ariaLabel}
                onClick={() => navigate(action.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(action.path);
                  }
                }}
                sx={{
                  p: { xs: 1.25, sm: 1.5 },
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  textAlign: 'center',
                  minHeight: { xs: 88, sm: 92 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.75,
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                  },
                  '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                    },
                  },
                }}
              >
                <Box sx={{ color: 'primary.main', display: 'flex', '& .MuiSvgIcon-root': { fontSize: 26 } }}>
                  <Icon fontSize="inherit" aria-hidden />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.25, px: 0.5 }}>
                  {isMobileNav ? action.shortLabel : action.label}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
