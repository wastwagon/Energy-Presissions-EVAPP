import { ReactNode, useRef, useState, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useCustomerPullRefreshContext } from '../../contexts/CustomerPullRefreshContext';
import { prefersReducedMotion } from '../../utils/motionPreference';

const PULL_THRESHOLD_PX = 72;
const MAX_PULL_PX = 120;

interface PullToRefreshProps {
  children: ReactNode;
  /** Scroll container element id (customer main) */
  scrollTargetId: string;
}

/**
 * Pull-to-refresh overlay for the customer dashboard scroll region.
 * Pages register refresh via `useCustomerPullRefresh`.
 */
export function PullToRefresh({ children, scrollTargetId }: PullToRefreshProps) {
  const ctx = useCustomerPullRefreshContext();
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const pullingRef = useRef(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (prefersReducedMotion()) return;
      const scrollEl = document.getElementById(scrollTargetId);
      if (!scrollEl || scrollEl.scrollTop > 4 || !ctx?.getHandler()) return;
      touchStartY.current = e.touches[0]?.clientY ?? 0;
      pullingRef.current = true;
    },
    [ctx, scrollTargetId],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pullingRef.current || !ctx?.getHandler()) return;
      const scrollEl = document.getElementById(scrollTargetId);
      if (!scrollEl || scrollEl.scrollTop > 4) {
        pullingRef.current = false;
        setPullDistance(0);
        return;
      }
      const dy = (e.touches[0]?.clientY ?? 0) - touchStartY.current;
      if (dy > 0) {
        setPullDistance(Math.min(dy * 0.45, MAX_PULL_PX));
      }
    },
    [ctx, scrollTargetId],
  );

  const onTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    const handler = ctx?.getHandler();
    const shouldRefresh = pullDistance >= PULL_THRESHOLD_PX && handler;
    setPullDistance(0);
    if (shouldRefresh && ctx && handler) {
      ctx.setPulling(true);
      try {
        await handler();
      } finally {
        ctx.setPulling(false);
      }
    }
  }, [pullDistance, ctx]);

  const showIndicator = pullDistance > 8 || ctx?.pulling;

  return (
    <Box
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      sx={{ position: 'relative', minHeight: '100%' }}
    >
      {showIndicator ? (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: Math.max(pullDistance, ctx?.pulling ? PULL_THRESHOLD_PX : 0),
            pointerEvents: 'none',
            zIndex: 2,
            transition: ctx?.pulling ? 'height 0.15s ease' : 'none',
          }}
          aria-live="polite"
          role="status"
        >
          {ctx?.pulling ? (
            <CircularProgress size={22} thickness={5} sx={{ mb: 1 }} />
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, fontSize: '0.75rem' }}>
              {pullDistance >= PULL_THRESHOLD_PX ? 'Release to refresh' : 'Pull to refresh'}
            </Typography>
          )}
        </Box>
      ) : null}
      {children}
    </Box>
  );
}
