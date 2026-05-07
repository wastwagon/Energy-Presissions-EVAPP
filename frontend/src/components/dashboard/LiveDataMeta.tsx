import { Typography } from '@mui/material';

interface LiveDataMetaProps {
  updatedAt: number | null;
  liveLabel?: string;
  showSeconds?: boolean;
}

export function LiveDataMeta({
  updatedAt,
  liveLabel = 'Live sync on',
  showSeconds = false,
}: LiveDataMetaProps) {
  const updatedLabel = updatedAt
    ? new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        ...(showSeconds ? { second: '2-digit' } : {}),
      }).format(updatedAt)
    : '—';

  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
      {liveLabel} · updated {updatedLabel}
    </Typography>
  );
}
