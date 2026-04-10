import { Box, Container, Link, Paper, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AuthBrandHeader } from '../../components/auth/AuthBrandHeader';
import {
  SUPPORT_EMAIL,
  SUPPORT_LAST_UPDATED,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  SUPPORT_SECTIONS,
} from '../../legal/supportPageContent';
import { authPagePaperSx, authPageRootSx, authPageTitleSx } from '../../styles/authShell';

/**
 * Public support page for App Store “Support URL” and in-app deep link /support.
 */
export function SupportPage() {
  return (
    <Box sx={authPageRootSx}>
      <Container maxWidth="sm" disableGutters sx={{ width: '100%' }}>
        <Paper elevation={0} sx={{ ...authPagePaperSx, textAlign: 'left', alignItems: 'stretch' }}>
          <AuthBrandHeader />
          <Typography component="h1" variant="subtitle1" sx={{ ...authPageTitleSx, textAlign: 'center' }}>
            Help &amp; support
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
            Last updated: {SUPPORT_LAST_UPDATED}
          </Typography>

          {SUPPORT_SECTIONS.map((section) => (
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

          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
              Direct contacts
            </Typography>
            <Link href={`mailto:${SUPPORT_EMAIL}`} variant="body2" sx={{ display: 'block', mb: 0.75, fontWeight: 600 }}>
              {SUPPORT_EMAIL}
            </Link>
            <Link href={SUPPORT_PHONE_TEL} variant="body2" sx={{ display: 'block', fontWeight: 600 }}>
              {SUPPORT_PHONE_DISPLAY}
            </Link>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Link component={RouterLink} to="/login" variant="caption" sx={{ textDecoration: 'none' }}>
              ← Back to sign in
            </Link>
            <Link component={RouterLink} to="/privacy" variant="caption" sx={{ textDecoration: 'none' }}>
              Privacy Policy
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
