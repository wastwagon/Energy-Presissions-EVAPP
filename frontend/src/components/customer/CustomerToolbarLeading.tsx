import { IconButton, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { customerCompactNavTitleSx, customerCompactNavTitleWithBackSx } from '../../theme/customerChrome';
import { premiumIconButtonTouchSx, sxObject } from '../../styles/authShell';
import { useCustomerPageChrome } from '../../contexts/CustomerPageChromeContext';
import { triggerHaptic } from '../../utils/haptics';
import type { Theme } from '@mui/material/styles';

type CustomerToolbarLeadingProps = {
  showBottomNav: boolean;
  isCustomer: boolean;
  showCompactNavTitle: boolean;
};

/**
 * Native-style leading control: back chevron on stacked screens, nothing on tab roots
 * (tabs are the menu). Compact title appears when the large in-page title scrolls away.
 */
export function CustomerToolbarLeading({
  showBottomNav,
  isCustomer,
  showCompactNavTitle,
}: CustomerToolbarLeadingProps) {
  const pageChrome = useCustomerPageChrome();
  const navBack = pageChrome?.navBack;

  if (!showBottomNav || !isCustomer) {
    return null;
  }

  const titleBlock =
    showCompactNavTitle && pageChrome?.pageTitle ? (
      <Typography
        variant="subtitle1"
        component="h1"
        noWrap
        sx={navBack ? customerCompactNavTitleWithBackSx : customerCompactNavTitleSx}
      >
        {pageChrome.pageTitle}
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
          sx={(th: Theme) => ({
            ...sxObject(th, premiumIconButtonTouchSx),
            color: 'primary.main',
            ml: -0.5,
          })}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
        </IconButton>
      ) : null}
      {titleBlock}
    </>
  );
}
