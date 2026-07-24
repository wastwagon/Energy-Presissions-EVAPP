import { Box, Typography } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getPrivacyPolicyLink, getSupportLink, getTermsOfServiceLink } from '../../config/legal.config';
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '../../legal/supportPageContent';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { GroupedExpandableRow } from '../../components/ios/GroupedExpandableRow';
import { authPageBodySx } from '../../styles/authShell';
import { CUSTOMER_IMAGES } from '../../config/customerImagery';
import { iosRadii } from '../../theme/iosMobileTokens';

const faqs = [
  {
    q: 'How do I start charging?',
    a: 'Open Find chargers, pick a station, then Start charging. Keep a wallet balance ready — top up with mobile money or card if needed.',
  },
  {
    q: 'How do I add wallet funds?',
    a: 'Wallet → Top up. Pay with MTN, Vodafone, AirtelTigo, or card via Paystack.',
  },
  {
    q: 'What if a session stops early?',
    a: 'You only pay for energy used. Check the session details; contact support if the charge looks wrong.',
  },
  {
    q: 'How do I find nearby stations?',
    a: 'Allow location, then use Find chargers. You can also search by city or region.',
  },
  {
    q: 'What payments are accepted?',
    a: 'Mobile money (MTN, Vodafone, AirtelTigo) and cards via Paystack. Prices are in GHS.',
  },
];

export function CustomerHelpPage() {
  const privacy = getPrivacyPolicyLink();
  const terms = getTermsOfServiceLink();
  const support = getSupportLink();
  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Help"
        subtitle="Answers and ways to reach us"
        updatedAt={null}
        refreshing={false}
        onRefresh={() => {}}
        refreshDisabled
        showRefresh={false}
        showLiveMeta={false}
        titleVariant="large"
        containerSx={{ mb: 1.5 }}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 2, sm: 2.5 },
          mb: { xs: 2.5, sm: 3 },
          mx: { xs: -2, sm: 0 },
          px: { xs: 2, sm: 0 },
        }}
      >
        <Box
          component="img"
          src={CUSTOMER_IMAGES.helpSupport}
          alt="Help and support"
          loading="lazy"
          decoding="async"
          sx={{
            width: { xs: '100%', sm: 148 },
            maxWidth: { xs: 220, sm: 148 },
            height: { xs: 160, sm: 148 },
            objectFit: 'cover',
            borderRadius: `${iosRadii.lg}px`,
            mx: { xs: 'auto', sm: 0 },
            flexShrink: 0,
            bgcolor: 'primary.dark',
          }}
        />
        <Box sx={{ minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography
            component="p"
            sx={{
              m: 0,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.15rem', sm: '1.25rem' },
              lineHeight: 1.25,
            }}
          >
            We're here when charging gets stuck
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.75, lineHeight: 1.45, maxWidth: 420, mx: { xs: 'auto', sm: 0 } }}
          >
            Browse common questions below, or email and call support directly.
          </Typography>
        </Box>
      </Box>

      <GroupedListSection title="FAQ">
        {faqs.map((faq, idx) => (
          <GroupedExpandableRow key={faq.q} primary={faq.q} divider={idx < faqs.length - 1}>
            {faq.a}
          </GroupedExpandableRow>
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
          primary="Help on the web"
          showChevron={false}
          end={<ChevronRightIcon sx={{ color: 'text.disabled' }} />}
          onClick={() => {
            if (support.external) window.open(support.href, '_blank', 'noopener,noreferrer');
            else window.location.href = support.href;
          }}
        />
      </GroupedListSection>

      <Typography component="p" sx={{ ...authPageBodySx, fontSize: '0.75rem', px: 0.5, pt: 0.5 }}>
        App Store and Play Store use the same legal links as above.
      </Typography>
    </Box>
  );
}
