import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { triggerHaptic } from '../../utils/haptics';

interface MobileListLoadMoreProps {
  /** 1-based current page */
  page: number;
  totalCount: number;
  pageSize: number;
  loading?: boolean;
  onLoadMore: () => void;
}

export function MobileListLoadMore({
  page,
  totalCount,
  pageSize,
  loading = false,
  onLoadMore,
}: MobileListLoadMoreProps) {
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasMore = page < pageCount;
  const loadedCount = Math.min(page * pageSize, totalCount);

  if (!hasMore || totalCount <= pageSize) {
    return null;
  }

  return (
    <Box sx={{ pt: 2, pb: 0.5, px: 0.5 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: 'center', mb: 1.5, fontSize: '0.8125rem' }}
      >
        Showing {loadedCount} of {totalCount}
      </Typography>
      <Button
        variant="outlined"
        fullWidth
        disabled={loading}
        onClick={() => {
          triggerHaptic('light');
          onLoadMore();
        }}
        sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx) })}
      >
        {loading ? (
          <>
            <CircularProgress size={18} sx={{ mr: 1 }} />
            Loading…
          </>
        ) : (
          'Load more'
        )}
      </Button>
    </Box>
  );
}
