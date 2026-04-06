import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import GavelIcon from '@mui/icons-material/Gavel';
import { LegalDocLink } from '../../components/legal/LegalAuthNotice';
import { getPrivacyPolicyLink, getTermsOfServiceLink } from '../../config/legal.config';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx } from '../../theme/jampackShell';
import { premiumIconButtonTouchSx, sxObject } from '../../styles/authShell';

const faqs = [
  {
    q: 'How do I start charging my EV?',
    a: 'Find a station using "Find Stations", select a station, and tap "Start Charging". Ensure your wallet has sufficient balance. You can top up via mobile money or card.',
  },
  {
    q: 'How do I add funds to my wallet?',
    a: 'Go to Wallet > Top Up. You can pay with mobile money (MTN, Vodafone, AirtelTigo) or card via Paystack.',
  },
  {
    q: 'What if my charging session is interrupted?',
    a: 'You are only charged for the energy consumed. If the session stops unexpectedly, check the transaction details. Contact support if you believe you were overcharged.',
  },
  {
    q: 'How do I find charging stations near me?',
    a: 'Enable location services and use "Find Stations" to see nearby stations. You can also search by city or region.',
  },
  {
    q: 'Can I save my favorite stations?',
    a: 'Yes! Tap the heart icon on any station card to add it to your favorites. Access them quickly from the Favorite Stations menu.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept mobile money (MTN, Vodafone, AirtelTigo) and card payments via Paystack. All prices are in Ghana Cedis (GHS).',
  },
];

export function CustomerHelpPage() {
  const theme = useTheme();
  const privacy = getPrivacyPolicyLink();
  const terms = getTermsOfServiceLink();
  const legalLinkTouchSx = {
    ...sxObject(theme, premiumIconButtonTouchSx),
    py: 1,
    display: 'inline-flex' as const,
    alignItems: 'center',
    alignSelf: 'flex-start',
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
          Help & Support
        </Typography>
        <Typography variant="body2" sx={dashboardPageSubtitleSx}>
          Frequently asked questions and how to get in touch
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ ...premiumPanelCardSx, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, mb: 1 }}>
          <GavelIcon fontSize="small" aria-hidden />
          Privacy &amp; terms
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Read our Privacy Policy and Terms of Service (same links used in the App Store and Google Play listings).
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
          <LegalDocLink
            label="Privacy Policy"
            href={privacy.href}
            external={privacy.external}
            variant="body2"
            sx={legalLinkTouchSx}
          />
          <LegalDocLink
            label="Terms of Service"
            href={terms.href}
            external={terms.external}
            variant="body2"
            sx={legalLinkTouchSx}
          />
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ ...premiumPanelCardSx, mb: 3, p: 0, overflow: 'hidden' }}>
        <Typography variant="subtitle1" sx={{ px: { xs: 2, sm: 2.5 }, pt: { xs: 2, sm: 2.5 }, pb: 1, fontWeight: 600 }}>
          Frequently asked questions
        </Typography>
        {faqs.map((faq, idx) => (
          <Accordion
            key={idx}
            disableGutters
            elevation={0}
            sx={{ '&:before': { display: 'none' }, bgcolor: 'transparent' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48, '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography fontWeight={500} variant="body2">
                {faq.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                {faq.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      <Paper elevation={0} sx={premiumPanelCardSx}>
        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, mb: 1 }}>
          <SupportAgentIcon fontSize="small" color="primary" />
          Contact support
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Need more help? Reach out to our support team.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Link
            href="mailto:support@cleanmotionghana.com"
            sx={{
              ...sxObject(theme, premiumIconButtonTouchSx),
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              py: 0.5,
            }}
          >
            <EmailIcon fontSize="small" />
            support@cleanmotionghana.com
          </Link>
          <Link
            href="tel:+233244000000"
            sx={{
              ...sxObject(theme, premiumIconButtonTouchSx),
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              py: 0.5,
            }}
          >
            <PhoneIcon fontSize="small" />
            +233 24 400 0000
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}
