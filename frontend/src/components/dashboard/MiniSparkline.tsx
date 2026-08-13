import { Box, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

type MiniSparklineProps = {
  values: number[];
  /** Accessible label for the sparkline graphic */
  label?: string;
  /** ViewBox width (coordinate space). */
  width?: number;
  /** ViewBox height (coordinate space). */
  height?: number;
  /** Stretch SVG to parent width/height (wallet activity chart). */
  fillParent?: boolean;
};

/**
 * Compact SVG sparkline for KPI cards (Untitled UI–style). Teal brand stroke.
 */
export function MiniSparkline({
  values,
  label = 'Trend',
  width = 88,
  height = 28,
  fillParent = false,
}: MiniSparklineProps) {
  const theme = useTheme();
  const stroke = theme.palette.primary.main;
  const fill = alpha(theme.palette.primary.main, 0.12);

  if (values.length < 2) {
    return null;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padY = 2;
  const innerH = height - padY * 2;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = padY + innerH - ((v - min) / range) * innerH;
    return `${x},${y}`;
  });

  const areaPoints = `0,${height} ${points.join(' ')} ${width},${height}`;

  return (
    <Box
      component="svg"
      role="img"
      aria-label={label}
      width={fillParent ? '100%' : width}
      height={fillParent ? '100%' : height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={fillParent ? 'none' : 'xMidYMid meet'}
      sx={{
        display: 'block',
        flexShrink: 0,
        overflow: 'visible',
        ...(fillParent ? { width: '100%', height: '100%' } : null),
      }}
    >
      <polygon points={areaPoints} fill={fill} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth={fillParent ? 2.25 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}
