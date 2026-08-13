import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { iosRadii } from '../../theme/iosMobileTokens';

export type AuthMode = 'login' | 'register';

type AuthModeTabsProps = {
  value: AuthMode;
};

/**
 * Untitled UI–style Sign up / Log in segmented control (light).
 */
export function AuthModeTabs({ value }: AuthModeTabsProps) {
  const navigate = useNavigate();

  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      size="small"
      value={value}
      onChange={(_, next: AuthMode | null) => {
        if (next === 'login') navigate('/login');
        if (next === 'register') navigate('/register');
      }}
      aria-label="Authentication mode"
      sx={{
        p: 0.5,
        bgcolor: (t) => t.palette.action.hover,
        borderRadius: `${iosRadii.md}px`,
        border: '1px solid',
        borderColor: 'divider',
        '& .MuiToggleButtonGroup-grouped': {
          border: 0,
          borderRadius: `${iosRadii.sm}px !important`,
          mx: 0,
          py: 1,
          minHeight: 40,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          color: 'text.secondary',
          '&.Mui-selected': {
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: 'background.paper' },
          },
        },
      }}
    >
      <ToggleButton value="register" aria-label="Sign up">
        Sign up
      </ToggleButton>
      <ToggleButton value="login" aria-label="Log in">
        Log in
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
