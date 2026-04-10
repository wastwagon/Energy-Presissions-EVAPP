import { Box, Container, Paper, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AuthBrandHeader } from '../../components/auth/AuthBrandHeader';
import { PRIVACY_LAST_UPDATED, PRIVACY_SECTIONS } from '../../legal/privacyPolicyContent';
import { authPagePaperSx, authPageRootSx, authPageTitleSx } from '../../styles/authShell';

/**
 * In-app privacy policy for web / WebViewGold. Canonical static HTML: /privacy (privacy.html).
 * Have counsel review before relying on this for compliance.
 */
export function PrivacyPolicyPage() {
  return (
    <Box sx={authPageRootSx}>
      <Container maxWidth="sm" disableGutters sx={{ width: '100%' }}>
        <Paper elevation={0} sx={{ ...authPagePaperSx, textAlign: 'left', alignItems: 'stretch' }}>
          <AuthBrandHeader />
          <Typography component="h1" variant="subtitle1" sx={{ ...authPageTitleSx, textAlign: 'center' }}>
            Privacy Policy
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
            Last updated: {PRIVACY_LAST_UPDATED}
          </Typography>

          {PRIVACY_SECTIONS.map((section) => (
            <Box key={section.id} sx={{ mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 0.5 }}>
                {section.title}
              </Typography>
              {section.introNote ? (
                <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6, fontStyle: 'italic', color: 'text.secondary' }}>
                  {section.introNote}
                </Typography>
              ) : null}
              {section.paragraphs?.map((p, i) => (
                <Typography key={`${section.id}-p-${i}`} variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>
                  {p}
                </Typography>
              ))}
              {section.bullets?.length ? (
                <Box component="ul" sx={{ pl: 2.5, mb: 1, lineHeight: 1.6, '& li': { mb: 0.75 } }}>
                  {section.bullets.map((b) => (
                    <Typography key={b.lead} component="li" variant="body2">
                      <strong>{b.lead}:</strong> {b.text}
                    </Typography>
                  ))}
                </Box>
              ) : null}
              {section.afterBullets?.map((p, i) => (
                <Typography key={`${section.id}-after-${i}`} variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>
                  {p}
                </Typography>
              ))}
            </Box>
          ))}

          <Box sx={{ mt: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Link component={RouterLink} to="/login" variant="caption" sx={{ textDecoration: 'none' }}>
              ← Back to sign in
            </Link>
            <Link component={RouterLink} to="/support" variant="caption" sx={{ textDecoration: 'none' }}>
              Help &amp; support
            </Link>
            <Link component={RouterLink} to="/terms" variant="caption" sx={{ textDecoration: 'none' }}>
              Terms of Service
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
