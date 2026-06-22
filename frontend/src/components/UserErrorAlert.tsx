import { Link as RouterLink } from 'react-router-dom';
import { Alert, Button, type AlertProps } from '@mui/material';
import {
  formatUserFacingError,
  userErrorActionRoute,
  type UserErrorContext,
} from '../utils/userFriendlyErrors';
import { triggerHaptic } from '../utils/haptics';

type UserErrorAlertProps = {
  /** Raw API error, Error object, or pre-formatted message string. */
  error: unknown;
  context?: UserErrorContext;
  severity?: AlertProps['severity'];
  sx?: AlertProps['sx'];
  onClose?: () => void;
  /** Called when user taps an action (e.g. navigate to top-up). */
  onAction?: () => void;
};

export function UserErrorAlert({
  error,
  context = 'general',
  severity = 'error',
  sx,
  onClose,
  onAction,
}: UserErrorAlertProps) {
  if (error == null || error === '') {
    return null;
  }

  const formatted =
    typeof error === 'string'
      ? formatUserFacingError({ message: error }, context)
      : formatUserFacingError(error, context);

  const actionRoute = userErrorActionRoute(formatted.action);

  return (
    <Alert
      severity={severity}
      sx={sx}
      onClose={onClose}
      action={
        actionRoute && formatted.actionLabel ? (
          <Button
            component={RouterLink}
            to={actionRoute}
            size="small"
            color="inherit"
            onClick={() => {
              triggerHaptic('light');
              onAction?.();
            }}
          >
            {formatted.actionLabel}
          </Button>
        ) : undefined
      }
    >
      {formatted.message}
    </Alert>
  );
}
