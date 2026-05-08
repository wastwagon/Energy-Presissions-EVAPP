import LinearProgress from '@mui/material/LinearProgress';

type Props = {
  /** When true, overlays the top edge of the parent (parent should use `position: 'relative'`). */
  active: boolean;
  ariaLabel?: string;
};

/** Inline loading bar for paginated / refetched table surfaces — avoids replacing the whole page with a skeleton. */
export function TableSurfaceProgress({ active, ariaLabel = 'Loading table data' }: Props) {
  if (!active) return null;
  return (
    <LinearProgress
      sx={{ position: 'absolute', top: 0, left: 0, right: 0, borderRadius: 0, zIndex: 2 }}
      aria-label={ariaLabel}
    />
  );
}
