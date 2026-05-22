import { ReactNode, useCallback, useEffect } from 'react';
import { Box, LinearProgress, SxProps, Theme, Typography, useMediaQuery, useTheme } from '@mui/material';
import { LiveDataMeta } from './LiveDataMeta';
import { RefreshButton } from './RefreshButton';
import { customerLargeSubtitleSx, customerLargeTitleSx } from '../../theme/customerChrome';
import { dashboardPageSubtitleSx, dashboardPageTitleSx } from '../../theme/jampackShell';
import { useCustomerPageChrome } from '../../contexts/CustomerPageChromeContext';
import { useCustomerPullRefreshContext } from '../../contexts/CustomerPullRefreshContext';

interface LivePageHeaderProps {
  title: string;
  subtitle: string;
  /** `large` = iOS navigation title on mobile (compact on md+) */
  titleVariant?: 'compact' | 'large';
  updatedAt: number | null;
  liveLabel?: string;
  showSeconds?: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  refreshDisabled?: boolean;
  /** Keep the Refresh button visible on phone widths even when pull-to-refresh is registered. */
  showToolbarRefreshOnMobile?: boolean;
  titleSx?: SxProps<Theme>;
  subtitleSx?: SxProps<Theme>;
  containerSx?: SxProps<Theme>;
  refreshSx?: SxProps<Theme>;
  actions?: ReactNode;
}

export function LivePageHeader({
  title,
  subtitle,
  updatedAt,
  liveLabel,
  showSeconds = false,
  refreshing,
  onRefresh,
  refreshDisabled = false,
  showToolbarRefreshOnMobile = false,
  titleVariant = 'compact',
  titleSx,
  subtitleSx,
  containerSx,
  refreshSx,
  actions,
}: LivePageHeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const chrome = useCustomerPageChrome();
  const pullRefresh = useCustomerPullRefreshContext();
  const registerLargeTitle = titleVariant === 'large' && isMobile && Boolean(chrome);
  const hideToolbarRefresh =
    isMobile &&
    Boolean(pullRefresh?.hasRefreshHandler) &&
    !refreshDisabled &&
    !showToolbarRefreshOnMobile;

  const titleSentinelRef = useCallback(
    (node: HTMLElement | null) => {
      chrome?.registerTitleSentinel(node);
    },
    [chrome],
  );

  useEffect(() => {
    if (!registerLargeTitle || !chrome) return;
    chrome.setPageTitle(title);
    return () => chrome.setPageTitle(null);
  }, [chrome, title, registerLargeTitle]);

  const resolvedTitleSx = titleSx ?? (titleVariant === 'large' ? customerLargeTitleSx : dashboardPageTitleSx);
  const resolvedSubtitleSx =
    subtitleSx ?? (titleVariant === 'large' ? customerLargeSubtitleSx : dashboardPageSubtitleSx);

  return (
    <>
      {refreshing && (
        <LinearProgress sx={{ mb: 2, borderRadius: 1 }} aria-label={`Updating ${title.toLowerCase()}`} />
      )}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          flexWrap: 'wrap',
          ...containerSx,
        }}
      >
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={resolvedTitleSx}>
            {title}
          </Typography>
          {registerLargeTitle && (
            <Box ref={titleSentinelRef} sx={{ height: 1, width: '100%' }} aria-hidden />
          )}
          <Typography variant="body2" sx={resolvedSubtitleSx}>
            {subtitle}
          </Typography>
          <LiveDataMeta updatedAt={updatedAt} liveLabel={liveLabel} showSeconds={showSeconds} />
        </Box>
        {(actions || !hideToolbarRefresh) && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            {!hideToolbarRefresh && (
              <RefreshButton
                refreshing={refreshing}
                disabled={refreshDisabled}
                onClick={onRefresh}
                sx={refreshSx ?? { width: { xs: '100%', sm: 'auto' } }}
              />
            )}
            {actions}
          </Box>
        )}
      </Box>
    </>
  );
}
