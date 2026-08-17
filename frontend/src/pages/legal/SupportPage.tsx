import { Box, Container, Link, Paper, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AuthBrandHeader } from '../../components/auth/AuthBrandHeader';
import {
  SUPPORT_EMAIL,
  SUPPORT_LAST_UPDATED,
  SUPPORT_SECTIONS,
  getSupportPhone,
} from '../../legal/supportPageContent';
import {
  authPageBodySx,
  authPageLinkSx,
  authPagePaperSx,
  authPageRootSx,
  authPageTitleSx,
} from '../../styles/authShell';
import { iosFontStacks } from '../../theme/iosMobileTokens';

/**
 * Public support page for App Store “Support URL” and in-app deep link /support.
 */
export function SupportPage() {
  const phone = getSupportPhone();
  return (
    <Box sx={authPageRootSx}>
      <Container maxWidth="sm" disableGutters sx={{ width: '100%' }}>
        <Paper elevation={0} sx={{ ...authPagePaperSx, textAlign: 'left', alignItems: 'stretch' }}>
          <AuthBrandHeader />
          <Typography component="h1" variant="subtitle1" sx={{ ...authPageTitleSx, textAlign: 'center' }}>
            Help &amp; support
          </Typography>
          <Typography component="p" sx={{ ...authPageBodySx, display: 'block', textAlign: 'center', mb: 2 }}>
            Last updated: {SUPPORT_LAST_UPDATED}
          </Typography>

          {SUPPORT_SECTIONS.map((section) => (
            <Box key={section.id}>
              <Typography
                variant="subtitle2"
                sx={{ fontFamily: iosFontStacks.ui, fontWeight: 700, mt: 2, mb: 0.5, letterSpacing: '-0.02em' }}
              >
                {section.title}
              </Typography>
              {section.paragraphs.map((p, i) => (
                <Typography key={`${section.id}-p-${i}`} component="p" sx={{ ...authPageBodySx, mb: 1 }}>
                  {p}
                </Typography>
              ))}
            </Box>
          ))}

          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontFamily: iosFontStacks.ui, fontWeight: 700, mb: 0.75, letterSpacing: '-0.02em' }}
            >
              Direct contacts
            </Typography>
            <Link href={`mailto:${SUPPORT_EMAIL}`} sx={{ ...authPageLinkSx, display: 'flex', fontWeight: 600 }}>
              {SUPPORT_EMAIL}
            </Link>
            {phone ? (
              <Link href={phone.tel} sx={{ ...authPageLinkSx, display: 'flex', fontWeight: 600 }}>
                {phone.display}
              </Link>
            ) : null}
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Link component={RouterLink} to="/login" sx={authPageLinkSx}>
              ← Back to sign in
            </Link>
            <Link component={RouterLink} to="/privacy" sx={authPageLinkSx}>
              Privacy Policy
            </Link>
            <Link component={RouterLink} to="/terms" sx={authPageLinkSx}>
              Terms of Service
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
