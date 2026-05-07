import { ReactNode } from 'react';
import { Box, LinearProgress, SxProps, Theme, Typography } from '@mui/material';
import { LiveDataMeta } from './LiveDataMeta';
import { RefreshButton } from './RefreshButton';

interface LivePageHeaderProps {
  title: string;
  subtitle: string;
  updatedAt: number | null;
  liveLabel?: string;
  showSeconds?: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  refreshDisabled?: boolean;
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
  titleSx,
  subtitleSx,
  containerSx,
  refreshSx,
  actions,
}: LivePageHeaderProps) {
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
          <Typography variant="h6" component="h1" sx={titleSx}>
            {title}
          </Typography>
          <Typography variant="body2" sx={subtitleSx}>
            {subtitle}
          </Typography>
          <LiveDataMeta updatedAt={updatedAt} liveLabel={liveLabel} showSeconds={showSeconds} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
          <RefreshButton
            refreshing={refreshing}
            disabled={refreshDisabled}
            onClick={onRefresh}
            sx={refreshSx ?? { width: { xs: '100%', sm: 'auto' } }}
          />
          {actions}
        </Box>
      </Box>
    </>
  );
}
