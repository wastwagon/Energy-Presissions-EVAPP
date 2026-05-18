import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getPrivacyPolicyLink, getSupportLink, getTermsOfServiceLink } from '../../config/legal.config';
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '../../legal/supportPageContent';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';

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
    q: 'What payment methods are accepted?',
    a: 'We accept mobile money (MTN, Vodafone, AirtelTigo) and card payments via Paystack. All prices are in Ghana Cedis (GHS).',
  },
];

export function CustomerHelpPage() {
  const privacy = getPrivacyPolicyLink();
  const terms = getTermsOfServiceLink();
  const support = getSupportLink();
  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Help & Support"
        subtitle="Frequently asked questions and how to get in touch"
        updatedAt={null}
        refreshing={false}
        onRefresh={() => {}}
        refreshDisabled
        titleVariant="large"
        containerSx={{ mb: 2 }}
      />

      <GroupedListSection title="Privacy & terms">
        <GroupedListRow
          primary="Privacy Policy"
          showChevron={false}
          divider
          end={<ChevronRightIcon sx={{ color: 'text.disabled' }} />}
          onClick={() => {
            if (privacy.external) window.open(privacy.href, '_blank', 'noopener,noreferrer');
            else window.location.href = privacy.href;
          }}
        />
        <GroupedListRow
          primary="Terms of Service"
          showChevron={false}
          divider
          end={<ChevronRightIcon sx={{ color: 'text.disabled' }} />}
          onClick={() => {
            if (terms.external) window.open(terms.href, '_blank', 'noopener,noreferrer');
            else window.location.href = terms.href;
          }}
        />
        <GroupedListRow
          primary="Help & support (web)"
          showChevron={false}
          end={<ChevronRightIcon sx={{ color: 'text.disabled' }} />}
          onClick={() => {
            if (support.external) window.open(support.href, '_blank', 'noopener,noreferrer');
            else window.location.href = support.href;
          }}
        />
      </GroupedListSection>

      <GroupedListSection title="FAQ" paperSx={{ p: 0, overflow: 'hidden' }}>
        {faqs.map((faq, idx) => (
          <Accordion
            key={faq.q}
            disableGutters
            elevation={0}
            sx={{
              '&:before': { display: 'none' },
              bgcolor: 'transparent',
              borderBottom: idx < faqs.length - 1 ? '1px solid' : 'none',
              borderColor: idx < faqs.length - 1 ? 'divider' : undefined,
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ minHeight: 48, px: 2, '& .MuiAccordionSummary-content': { my: 1 } }}
            >
              <Typography fontWeight={500} variant="body2">
                {faq.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {faq.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </GroupedListSection>

      <GroupedListSection title="Contact">
        <GroupedListRow
          primary="Email"
          secondary={SUPPORT_EMAIL}
          showChevron={false}
          divider
          onClick={() => {
            window.location.href = `mailto:${SUPPORT_EMAIL}`;
          }}
          end={<EmailIcon fontSize="small" color="action" />}
        />
        <GroupedListRow
          primary="Phone"
          secondary={SUPPORT_PHONE_DISPLAY}
          showChevron={false}
          onClick={() => {
            window.location.href = SUPPORT_PHONE_TEL;
          }}
          end={<PhoneIcon fontSize="small" color="action" />}
        />
      </GroupedListSection>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5, pt: 1 }}>
        <SupportAgentIcon fontSize="small" color="primary" />
        <Typography variant="caption" color="text.secondary">
          App Store and Play Store use the same legal links as above.
        </Typography>
      </Box>
    </Box>
  );
}
