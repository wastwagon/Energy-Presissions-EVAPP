import { IconButton, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { premiumIconButtonTouchSx, sxObject } from '../../styles/authShell';
import { useStaffPageChrome } from '../../contexts/StaffPageChromeContext';
import { staffCompactNavTitleSx } from '../../theme/staffChrome';
import { triggerHaptic } from '../../utils/haptics';
import type { Theme } from '@mui/material/styles';

type StaffToolbarLeadingProps = {
  navDrawerOpen: boolean;
  onOpenNavDrawer: () => void;
  navDrawerId: string;
  /** Phone-width staff shell with bottom nav (`sm` down). */
  showPhoneChrome: boolean;
  showCompactNavTitle: boolean;
};

export function StaffToolbarLeading({
  navDrawerOpen,
  onOpenNavDrawer,
  navDrawerId,
  showPhoneChrome,
  showCompactNavTitle,
}: StaffToolbarLeadingProps) {
  const pageChrome = useStaffPageChrome();
  const navBack = pageChrome?.navBack;

  const titleBlock =
    showPhoneChrome && showCompactNavTitle && pageChrome?.pageTitle ? (
      <Typography variant="subtitle1" component="h1" noWrap sx={staffCompactNavTitleSx}>
        {pageChrome.pageTitle}
      </Typography>
    ) : null;

  if (navBack) {
    return (
      <>
        <IconButton
          onClick={() => {
            triggerHaptic('light');
            navBack.onBack();
          }}
          aria-label={navBack.ariaLabel ?? 'Back'}
          edge="start"
          sx={(th: Theme) => ({
            ...sxObject(th, premiumIconButtonTouchSx),
            color: 'text.primary',
          })}
        >
          <ArrowBackIcon />
        </IconButton>
        {titleBlock}
      </>
    );
  }

  return (
    <>
      <IconButton
        color="inherit"
        edge="start"
        onClick={onOpenNavDrawer}
        aria-label="Open navigation menu"
        aria-expanded={navDrawerOpen}
        aria-controls={navDrawerId}
        sx={(th: Theme) => ({
          ...sxObject(th, premiumIconButtonTouchSx),
          display: { sm: 'none' },
          color: 'text.primary',
        })}
      >
        <MenuIcon />
      </IconButton>
      {titleBlock}
    </>
  );
}
