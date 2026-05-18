import { Box, Container, Paper, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AuthBrandHeader } from '../../components/auth/AuthBrandHeader';
import { TERMS_LAST_UPDATED, TERMS_SECTIONS } from '../../legal/termsOfServiceContent';
import {
  authPageBodySx,
  authPageLinkSx,
  authPagePaperSx,
  authPageRootSx,
  authPageTitleSx,
} from '../../styles/authShell';
import { iosFontStacks } from '../../theme/iosMobileTokens';

/**
 * In-app terms for web / WebViewGold. Canonical static HTML: /terms (terms.html).
 * Have counsel review before relying on this in production disputes.
 */
export function TermsOfServicePage() {
  return (
    <Box sx={authPageRootSx}>
      <Container maxWidth="sm" disableGutters sx={{ width: '100%' }}>
        <Paper elevation={0} sx={{ ...authPagePaperSx, textAlign: 'left', alignItems: 'stretch' }}>
          <AuthBrandHeader />
          <Typography component="h1" variant="subtitle1" sx={{ ...authPageTitleSx, textAlign: 'center' }}>
            Terms of Service
          </Typography>
          <Typography component="p" sx={{ ...authPageBodySx, display: 'block', textAlign: 'center', mb: 2 }}>
            Last updated: {TERMS_LAST_UPDATED}
          </Typography>

          {TERMS_SECTIONS.map((section) => (
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

          <Box sx={{ mt: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Link component={RouterLink} to="/login" sx={authPageLinkSx}>
              ← Back to sign in
            </Link>
            <Link component={RouterLink} to="/support" variant="caption" sx={{ textDecoration: 'none' }}>
              Help &amp; support
            </Link>
            <Link component={RouterLink} to="/privacy" variant="caption" sx={{ textDecoration: 'none' }}>
              Privacy Policy
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
