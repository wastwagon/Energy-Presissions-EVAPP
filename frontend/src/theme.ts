import { createAppTheme } from './theme/createAppTheme';
import { iosBrandColors } from './theme/iosMobileTokens';

/** Brand colors — canonical values live in `theme/iosMobileTokens.ts` */
export const brandColors = iosBrandColors;

/** App theme (light only). */
export const theme = createAppTheme();

export { createAppTheme };
