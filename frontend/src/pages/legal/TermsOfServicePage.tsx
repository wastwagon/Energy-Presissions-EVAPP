import { Box, Container, Paper, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AuthBrandHeader } from '../../components/auth/AuthBrandHeader';
import { TERMS_LAST_UPDATED, TERMS_SECTIONS } from '../../legal/termsOfServiceContent';
import { authPagePaperSx, authPageRootSx, authPageTitleSx } from '../../styles/authShell';

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
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
            Last updated: {TERMS_LAST_UPDATED}
          </Typography>

          {TERMS_SECTIONS.map((section) => (
            <Box key={section.id}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 0.5 }}>
                {section.title}
              </Typography>
              {section.paragraphs.map((p, i) => (
                <Typography key={`${section.id}-p-${i}`} variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>
                  {p}
                </Typography>
              ))}
            </Box>
          ))}

          <Box sx={{ mt: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Link component={RouterLink} to="/login" variant="caption" sx={{ textDecoration: 'none' }}>
              ← Back to sign in
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
