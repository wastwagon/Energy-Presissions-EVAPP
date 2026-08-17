import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AppEmptyState } from '../ui/AppEmptyState';
import { getDashboardPathForAccountType, getStoredUser } from '../../utils/authSession';

type FallbackProps = {
  onReset: () => void;
};

function ErrorFallback({ onReset }: FallbackProps) {
  const navigate = useNavigate();
  const home = getDashboardPathForAccountType(getStoredUser()?.accountType);

  return (
    <Box
      role="alert"
      sx={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 },
        pt: 'max(24px, var(--app-sat, env(safe-area-inset-top, 0px)))',
        pb: 'max(24px, env(safe-area-inset-bottom, 0px))',
        bgcolor: 'background.default',
        boxSizing: 'border-box',
        '@supports (min-height: 100dvh)': {
          minHeight: '100dvh',
        },
      }}
    >
      <AppEmptyState
        variant="plain"
        title="Something went wrong"
        description="This screen hit an error. You can try again or go back to home."
        primaryAction={{ label: 'Try again', onClick: onReset }}
        secondaryAction={{
          label: 'Go home',
          onClick: () => {
            onReset();
            navigate(home, { replace: true });
          },
          variant: 'secondary',
        }}
        sx={{ width: '100%', maxWidth: 420 }}
      />
    </Box>
  );
}

type Props = {
  children: ReactNode;
  /** Change this (e.g. pathname) to clear a caught error after navigation. */
  resetKey: string;
};

type State = {
  hasError: boolean;
  nonce: number;
};

/**
 * Catches render errors so a bad screen does not white-crash the WebView.
 * Resets when `resetKey` changes or the user taps Try again.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, nonce: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('AppErrorBoundary', error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState((s) => ({ hasError: false, nonce: s.nonce + 1 }));
    }
  }

  private handleReset = (): void => {
    this.setState((s) => ({ hasError: false, nonce: s.nonce + 1 }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }
    return <Fragment key={this.state.nonce}>{this.props.children}</Fragment>;
  }
}
