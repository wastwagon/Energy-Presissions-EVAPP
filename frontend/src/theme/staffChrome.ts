import type { SystemStyleObject } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import {
  customerCompactNavTitleSx,
  customerFrostedAppBarSx,
  customerFrostedChromeSx,
  customerLargeSubtitleSx,
  customerLargeTitleSx,
} from './customerChrome';

/** Staff portals use the same light frosted chrome as the customer app. */
export const staffFrostedChromeSx: SystemStyleObject<Theme> = customerFrostedChromeSx;

export const staffFrostedAppBarSx: SystemStyleObject<Theme> = customerFrostedAppBarSx;

export const staffLargeTitleSx: SystemStyleObject<Theme> = customerLargeTitleSx;

export const staffLargeSubtitleSx: SystemStyleObject<Theme> = customerLargeSubtitleSx;

export const staffCompactNavTitleSx: SystemStyleObject<Theme> = customerCompactNavTitleSx;

/** Money, kWh, and KPI figures — aligned digits. */
export const staffNumericSx: SystemStyleObject<Theme> = {
  fontVariantNumeric: 'tabular-nums',
};
