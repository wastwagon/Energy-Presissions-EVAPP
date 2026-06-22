import { useState } from 'react';
import { Button, CircularProgress, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import LoginIcon from '@mui/icons-material/Login';
import type { Transaction } from '../../services/transactionsApi';
import { chargePointsApi } from '../../services/chargePointsApi';
import { AdaptiveSheet } from '../ios/AdaptiveSheet';
import {
  authPageBodySx,
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  sxObject,
} from '../../styles/authShell';
import { triggerHaptic } from '../../utils/haptics';
import { UserErrorAlert } from '../UserErrorAlert';
import { formatUserFacingErrorMessage, UserMessages } from '../../utils/userFriendlyErrors';

type StationChargingTarget = {
  chargePointId: string;
  status: string;
  availableConnectors?: number;
};

type StationChargingButtonProps = {
  station: StationChargingTarget;
  isAuthenticated: boolean;
  activeSession?: Transaction | null;
  onStart: (e: React.MouseEvent) => void;
  onLoginPrompt?: (e: React.MouseEvent) => void;
  onStopped?: () => void;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
};

export function StationChargingButton({
  station,
  isAuthenticated,
  activeSession,
  onStart,
  onLoginPrompt,
  onStopped,
  fullWidth = true,
  size = 'medium',
}: StationChargingButtonProps) {
  const [stopOpen, setStopOpen] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [stopError, setStopError] = useState<string | null>(null);

  const canStart =
    ['Available', 'Preparing'].includes(station.status) && (station.availableConnectors ?? 0) > 0;

  const confirmStop = async () => {
    if (!activeSession || activeSession.recordPending) return;
    try {
      setStopping(true);
      setStopError(null);
      await chargePointsApi.remoteStop(activeSession.chargePointId, activeSession.transactionId);
      triggerHaptic('success');
      setStopOpen(false);
      onStopped?.();
    } catch (err: unknown) {
      setStopError(formatUserFacingErrorMessage(err, 'charging') || UserMessages.stopChargingFailed);
    } finally {
      setStopping(false);
    }
  };

  if (activeSession) {
    const stopDisabled = Boolean(activeSession.recordPending) || stopping;

    return (
      <>
        <Button
          variant="contained"
          color="error"
          fullWidth={fullWidth}
          size={size}
          disableElevation
          startIcon={stopping ? <CircularProgress size={16} color="inherit" /> : <StopIcon />}
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('light');
            setStopError(null);
            setStopOpen(true);
          }}
          disabled={stopDisabled}
          sx={(th) => ({
            ...sxObject(th, compactErrorContainedCtaSx),
            width: fullWidth ? '100%' : { xs: '100%', sm: 'auto' },
          })}
        >
          {stopping ? 'Stopping…' : 'Stop charging'}
        </Button>

        <AdaptiveSheet
          open={stopOpen}
          onClose={() => !stopping && setStopOpen(false)}
          title="Stop charging?"
          maxWidth="xs"
          disableClose={stopping}
          actions={
            <>
              <Button
                onClick={() => setStopOpen(false)}
                disabled={stopping}
                sx={(th) => sxObject(th, compactOutlinedCtaSx)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void confirmStop()}
                variant="contained"
                disableElevation
                disabled={stopDisabled}
                sx={(th) => sxObject(th, compactErrorContainedCtaSx)}
              >
                Stop charging
              </Button>
            </>
          }
        >
          <Typography component="p" sx={authPageBodySx}>
            {activeSession.recordPending
              ? 'Your session is still syncing with the charger. You can also unplug the cable to end charging.'
              : `Stop charging at ${activeSession.chargePointId}? You pay only for the energy used so far.`}
          </Typography>
          {stopError ? (
            <UserErrorAlert error={stopError} context="charging" sx={{ mt: 1 }} />
          ) : null}
        </AdaptiveSheet>
      </>
    );
  }

  if (!isAuthenticated) {
    if (!canStart) return null;
    return (
      <Button
        variant="contained"
        fullWidth={fullWidth}
        size={size}
        disableElevation
        startIcon={<LoginIcon />}
        onClick={(e) => {
          e.stopPropagation();
          triggerHaptic('light');
          onLoginPrompt?.(e);
        }}
        sx={(th) => ({
          ...sxObject(th, compactContainedCtaSx),
          width: fullWidth ? '100%' : { xs: '100%', sm: 'auto' },
        })}
      >
        Log in to start
      </Button>
    );
  }

  if (!canStart) {
    return null;
  }

  return (
    <Button
      variant="contained"
      color="primary"
      fullWidth={fullWidth}
      size={size}
      disableElevation
      startIcon={<PlayArrowIcon />}
      onClick={(e) => {
        e.stopPropagation();
        triggerHaptic('light');
        onStart(e);
      }}
      sx={(th) => ({
        ...sxObject(th, compactContainedCtaSx),
        width: fullWidth ? '100%' : { xs: '100%', sm: 'auto' },
      })}
    >
      Start charging
    </Button>
  );
}
