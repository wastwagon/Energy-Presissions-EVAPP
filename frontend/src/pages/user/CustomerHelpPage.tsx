import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Card,
  CardContent,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { dashboardPageTitleSx, dashboardPageSubtitleSx } from '../../theme/jampackShell';

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

      <Paper sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ p: 2, pb: 0 }}>
          Frequently Asked Questions
        </Typography>
        {faqs.map((faq, idx) => (
          <Accordion key={idx} disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={500}>{faq.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                {faq.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SupportAgentIcon />
            Contact Support
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Need more help? Reach out to our support team.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Link href="mailto:support@cleanmotionghana.com" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon fontSize="small" />
              support@cleanmotionghana.com
            </Link>
            <Link href="tel:+233244000000" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon fontSize="small" />
              +233 24 400 0000
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
