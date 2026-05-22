import { IconButton, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { customerCompactNavTitleSx } from '../../theme/customerChrome';
import { premiumIconButtonTouchSx, sxObject } from '../../styles/authShell';
import { useCustomerPageChrome } from '../../contexts/CustomerPageChromeContext';
import { triggerHaptic } from '../../utils/haptics';
import type { Theme } from '@mui/material/styles';

type CustomerToolbarLeadingProps = {
  showBottomNav: boolean;
  isCustomer: boolean;
  navDrawerOpen: boolean;
  onOpenNavDrawer: () => void;
  showCompactNavTitle: boolean;
  navDrawerId: string;
};

export function CustomerToolbarLeading({
  showBottomNav,
  isCustomer,
  navDrawerOpen,
  onOpenNavDrawer,
  showCompactNavTitle,
  navDrawerId,
}: CustomerToolbarLeadingProps) {
  const pageChrome = useCustomerPageChrome();
  const navBack = pageChrome?.navBack;

  if (!showBottomNav || !isCustomer) {
    return null;
  }

  const titleBlock =
    showCompactNavTitle && pageChrome?.pageTitle ? (
      <Typography variant="subtitle1" component="h1" noWrap sx={customerCompactNavTitleSx}>
        {pageChrome.pageTitle}
      </Typography>
    ) : !navBack ? (
      <Typography
        variant="h6"
        component="div"
        sx={{
          fontWeight: 700,
          letterSpacing: '-0.02em',
          fontSize: { xs: '1rem', sm: '1.0625rem' },
          color: 'primary.main',
          minWidth: 0,
          flex: '0 1 auto',
          mr: 1,
        }}
      >
        CleanMotion
      </Typography>
    ) : null;

  return (
    <>
      {navBack ? (
        <IconButton
          onClick={() => {
            triggerHaptic('light');
            navBack.onBack();
          }}
          aria-label={navBack.ariaLabel ?? 'Back'}
          edge="start"
          sx={(th: Theme) => ({ ...sxObject(th, premiumIconButtonTouchSx), color: 'text.primary' })}
        >
          <ArrowBackIcon />
        </IconButton>
      ) : (
        <IconButton
          onClick={onOpenNavDrawer}
          aria-label="Open app menu"
          aria-expanded={navDrawerOpen}
          aria-controls={navDrawerId}
          edge="start"
          sx={(th: Theme) => ({ ...sxObject(th, premiumIconButtonTouchSx), color: 'text.primary' })}
        >
          <MenuIcon />
        </IconButton>
      )}
      {titleBlock}
    </>
  );
}
