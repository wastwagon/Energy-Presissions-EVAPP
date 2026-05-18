import { createAppTheme } from './theme/createAppTheme';
import { iosBrandColors } from './theme/iosMobileTokens';

/** Brand colors — canonical values live in `theme/iosMobileTokens.ts` */
export const brandColors = iosBrandColors;

/** Default light theme (prefer `ColorModeProvider` at app root). */
export const theme = createAppTheme('light');

export { createAppTheme };
