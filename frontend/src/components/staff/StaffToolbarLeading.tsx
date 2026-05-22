import { IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { premiumIconButtonTouchSx, sxObject } from '../../styles/authShell';
import { useStaffPageChrome } from '../../contexts/StaffPageChromeContext';
import { triggerHaptic } from '../../utils/haptics';
import type { Theme } from '@mui/material/styles';

type StaffToolbarLeadingProps = {
  navDrawerOpen: boolean;
  onOpenNavDrawer: () => void;
  navDrawerId: string;
};

export function StaffToolbarLeading({
  navDrawerOpen,
  onOpenNavDrawer,
  navDrawerId,
}: StaffToolbarLeadingProps) {
  const pageChrome = useStaffPageChrome();
  const navBack = pageChrome?.navBack;

  if (navBack) {
    return (
      <IconButton
        onClick={() => {
          triggerHaptic('light');
          navBack.onBack();
        }}
        aria-label={navBack.ariaLabel ?? 'Back'}
        edge="start"
        sx={(th: Theme) => ({
          ...sxObject(th, premiumIconButtonTouchSx),
          mr: 2,
          color: 'text.primary',
        })}
      >
        <ArrowBackIcon />
      </IconButton>
    );
  }

  return (
    <IconButton
      color="inherit"
      edge="start"
      onClick={onOpenNavDrawer}
      aria-label="Open navigation menu"
      aria-expanded={navDrawerOpen}
      aria-controls={navDrawerId}
      sx={(th: Theme) => ({
        ...sxObject(th, premiumIconButtonTouchSx),
        mr: 2,
        display: { sm: 'none' },
        color: 'text.primary',
      })}
    >
      <MenuIcon />
    </IconButton>
  );
}
