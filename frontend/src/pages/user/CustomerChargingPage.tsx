import { useEffect, useState, useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BarChartIcon from '@mui/icons-material/BarChart';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { transactionsApi, type Transaction } from '../../services/transactionsApi';
import { pickLastEndedChargingSession } from '../../utils/chargingSession';
import { getStoredUser } from '../../utils/authSession';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import { formatCurrency, formatEnergyKwh } from '../../utils/formatters';
import { mobileMainLayoutBottomMarginSx } from '../../theme/jampackShell';
import {
  chargingHeroShellSx,
  chargingListIconBoxSx,
  chargingListRowButtonSx,
  chargingLastSessionCardSx,
  chargingNavListPaperSx,
  chargingSubtleTextSx,
  chargingTitleSx,
} from '../../theme/chargingPremiumShell';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';

type NavItem = {
  id: string;
  primary: string;
  secondary?: string;
  to: string;
  Icon: SvgIconComponent;
};

const NAV: NavItem[] = [
  {
    id: 'find',
    primary: 'Find chargers',
    secondary: 'Map, search, and saved favorites',
    to: CUSTOMER_ROUTES.stations,
    Icon: LocationOnIcon,
  },
  {
    id: 'stats',
    primary: 'Charge stats',
    secondary: 'Session history and costs',
    to: CUSTOMER_ROUTES.sessionsHistory,
    Icon: BarChartIcon,
  },
  {
    id: 'live',
    primary: 'Live charging',
    secondary: 'Active sessions and stop',
    to: CUSTOMER_ROUTES.sessionsActive,
    Icon: BatteryChargingFullIcon,
  },
  {
    id: 'wallet',
    primary: 'Wallet & top up',
    to: CUSTOMER_ROUTES.wallet,
    Icon: AccountBalanceWalletIcon,
  },
  {
    id: 'pay',
    primary: 'Manage payment',
    secondary: 'Payment methods',
    to: CUSTOMER_ROUTES.paymentMethods,
    Icon: CreditCardIcon,
  },
];

export function CustomerChargingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSession, setLastSession] = useState<Transaction | null>(null);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const user = getStoredUser();
    const userId = typeof user?.id === 'number' ? user.id : null;
    if (!userId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setError(null);
        const [listRes, active] = await Promise.all([
          transactionsApi.getAll(20, 0, undefined, undefined, userId),
          transactionsApi.getActive(undefined, userId),
        ]);
        const txs = listRes?.transactions && Array.isArray(listRes.transactions) ? listRes.transactions : [];
        setLastSession(pickLastEndedChargingSession(txs));
        setActiveCount(active?.length ?? 0);
      } catch (e: unknown) {
        setError((e as Error)?.message || 'Could not load charging data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const lastLine = useMemo(() => {
    if (!lastSession?.stopTime) return null;
    const d = new Date(lastSession.stopTime);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }, [lastSession]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden', ...mobileMainLayoutBottomMarginSx }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper component="div" elevation={0} sx={chargingHeroShellSx}>
        <Typography component="h1" sx={chargingTitleSx}>
          Charging
        </Typography>
        <Typography sx={chargingSubtleTextSx} component="p">
          {activeCount > 0
            ? `${activeCount} live session${activeCount === 1 ? '' : 's'} — tap below to view or stop.`
            : 'Find stations, track energy, and manage payments in one place.'}
        </Typography>
      </Paper>

      <Paper elevation={0} sx={chargingNavListPaperSx}>
        <List disablePadding>
          {NAV.map((item) => {
            const Icon = item.Icon;
            return (
              <Box
                key={item.id}
                sx={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <ListItemButton
                  onClick={() => navigate(item.to)}
                  sx={chargingListRowButtonSx}
                >
                  <Box sx={chargingListIconBoxSx} aria-hidden>
                    <Icon sx={{ fontSize: 20 }} />
                  </Box>
                  <ListItemText
                    primary={item.primary}
                    secondary={item.secondary}
                    primaryTypographyProps={{ sx: { fontWeight: 600, fontSize: '0.9375rem' } }}
                    secondaryTypographyProps={{
                      sx: { color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' },
                    }}
                  />
                  <ChevronRightIcon sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 22, ml: 0.5 }} />
                </ListItemButton>
              </Box>
            );
          })}
        </List>
      </Paper>

      {lastSession && lastLine && (
        <Paper elevation={0} sx={chargingLastSessionCardSx}>
          <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em' }}>
            Last charge
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', mb: 1.5 }}>
            {lastLine}
            {lastSession.chargePointId ? ` · ${lastSession.chargePointId}` : ''}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
            {lastSession.totalCost != null && (
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'common.white' }}>
                {formatCurrency(Number(lastSession.totalCost), lastSession.currency || 'GHS')}
              </Typography>
            )}
            {lastSession.totalEnergyKwh != null && (
              <Typography variant="body2" component="span" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                {formatEnergyKwh(Number(lastSession.totalEnergyKwh))} kWh
                {lastSession.totalCost != null &&
                  lastSession.totalEnergyKwh != null &&
                  Number(lastSession.totalEnergyKwh) > 0 && (
                    <Box component="span" sx={{ display: 'block', fontSize: '0.8rem', mt: 0.5 }}>
                      @ {formatCurrency(
                        Number(lastSession.totalCost) / Number(lastSession.totalEnergyKwh),
                        lastSession.currency || 'GHS',
                      )}{' '}
                      / kWh
                    </Box>
                  )}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mt: 1 }}>
            <Button
              component={RouterLink}
              to={`${CUSTOMER_ROUTES.sessionsRoot}/${lastSession.transactionId}`}
              variant="outlined"
              size="small"
              fullWidth
              sx={(th) => ({
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'common.white',
                textTransform: 'none',
                ...sxObject(th, compactOutlinedCtaSx),
              })}
            >
              Details
            </Button>
            <Button
              component={RouterLink}
              to={CUSTOMER_ROUTES.sessionsHistory}
              variant="contained"
              size="small"
              fullWidth
              disableElevation
              sx={{ textTransform: 'none' }}
            >
              History
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
