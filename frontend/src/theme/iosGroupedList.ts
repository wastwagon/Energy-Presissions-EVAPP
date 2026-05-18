import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import { iosFontStacks, iosRadii, iosSemanticColors, IOS_TOUCH_TARGET_PX } from './iosMobileTokens';

/** Page background behind grouped sections (UITableView-style). */
export const iosGroupedPageBgSx: SystemStyleObject<Theme> = {
  bgcolor: (theme) =>
    theme.palette.mode === 'dark'
      ? theme.palette.background.default
      : iosSemanticColors.groupingBackground,
};

/** Uppercase-style section header above a grouped block. */
export const iosGroupedSectionHeaderSx: SystemStyleObject<Theme> = {
  display: 'block',
  px: 2,
  pb: 0.75,
  pt: 0.25,
  fontSize: '0.8125rem',
  fontWeight: 400,
  lineHeight: 1.35,
  color: 'text.secondary',
  textTransform: 'none',
  letterSpacing: '-0.01em',
  fontFamily: iosFontStacks.ui,
};

/** Inset rounded group container. */
export const iosGroupedPaperSx: SystemStyleObject<Theme> = {
  borderRadius: `${iosRadii.md}px`,
  bgcolor: 'background.paper',
  border: (theme) => `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  overflow: 'hidden',
};

export const iosGroupedListRowSx: SystemStyleObject<Theme> = {
  minHeight: IOS_TOUCH_TARGET_PX,
  py: 1.25,
  px: 2,
  '&:focus-visible': {
    outline: `2px solid`,
    outlineColor: 'primary.main',
    outlineOffset: -2,
  },
};

export const iosGroupedRowDividerSx: SystemStyleObject<Theme> = {
  ml: 2,
  borderColor: 'divider',
};
