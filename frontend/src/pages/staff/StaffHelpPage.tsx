import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedExpandableRow } from '../../components/ios/GroupedExpandableRow';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES } from '../../config/staffNav.paths';

const operatorFaqs = [
  {
    q: 'How do chargers appear in Devices?',
    a: 'A charge point shows up after it connects and sends BootNotification, or after you register it. Add coordinates so it also appears on the public Stations map.',
  },
  {
    q: 'How is pricing set?',
    a: 'Clean Motion sets per-kWh prices when chargers are commissioned. You cannot change tariffs from this dashboard.',
  },
  {
    q: 'How do I get paid?',
    a: 'Drivers top up a Clean Motion wallet. That money stays with the platform. Your dashboard shows sales from sessions on your chargers, plus the matured amount on your next payout. Add MoMo or bank details in Vendor settings; Clean Motion pays you on the cycle they set.',
  },
  {
    q: 'Where do live sessions live vs history?',
    a: 'Operations is live stations (online, charging, offline). Sessions is the transaction list. Dashboard is the decision home for period sales and the next matured payout.',
  },
  {
    q: 'How do I export numbers?',
    a: 'Reports downloads a sessions CSV for the selected period. Super Admin can also export vendors. Analytics keeps live charts and breakdowns.',
  },
  {
    q: 'How do I jump with the keyboard?',
    a: 'Press ⌘K (Mac) or Ctrl+K (Windows) to search pages. Or press G, then a letter (shown next to each drawer item). Esc closes the jump menu. Touch users can open Jump to from the avatar menu.',
  },
];

const networkFaqs = [
  {
    q: 'How do chargers appear in Devices?',
    a: 'A charge point shows up after it connects and sends BootNotification, or after you register it. Add coordinates so it also appears on the public Stations map.',
  },
  {
    q: 'How do I set pricing?',
    a: 'Open Tariffs and set per-kWh pricing when you commission a device. Vendors cannot edit prices.',
  },
  {
    q: 'How do vendors get paid?',
    a: 'Customer wallet top-ups and card payments land in the Clean Motion Paystack account. Set each vendor’s payout cycle and hold days when you create or edit them. The vendor adds MoMo or bank details. After you send the transfer, record the payout on Vendor Management so the ledger stays accurate. The vendor dashboard shows their matured next payout.',
  },
  {
    q: 'Where do live sessions live vs history?',
    a: 'Operations is live stations (online, charging, offline). Sessions is the transaction list. Dashboard is the decision home for period revenue across the network.',
  },
  {
    q: 'How do I export numbers?',
    a: 'Reports downloads a sessions CSV for the selected period. Super Admin can also export vendors. Analytics keeps live charts and breakdowns.',
  },
  {
    q: 'How do I jump with the keyboard?',
    a: 'Press ⌘K (Mac) or Ctrl+K (Windows) to search pages. Or press G, then a letter (shown next to each drawer item). Esc closes the jump menu. Touch users can open Jump to from the avatar menu.',
  },
];

export function StaffHelpPage({ variant = 'admin' }: { variant?: 'admin' | 'superadmin' }) {
  const navigate = useNavigate();
  const isNetwork = variant === 'superadmin';
  const faqs = isNetwork ? networkFaqs : operatorFaqs;
  const devices = isNetwork ? SUPERADMIN_ROUTES.opsDevices : ADMIN_ROUTES.opsDevices;
  const reports = isNetwork ? SUPERADMIN_ROUTES.reports : ADMIN_ROUTES.reports;

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Operator guide"
        subtitle={
          isNetwork
            ? 'Short answers for running chargers, pricing, payouts, and exports.'
            : 'Short answers for running chargers, payouts, and exports.'
        }
        updatedAt={null}
        refreshing={false}
        onRefresh={() => undefined}
        showRefresh={false}
        showLiveMeta={false}
        titleVariant="large"
        titleSx={staffLargeTitleSx}
        subtitleSx={staffLargeSubtitleSx}
      />

      <GroupedListSection title="FAQ">
        {faqs.map((faq, index) => (
          <GroupedExpandableRow key={faq.q} primary={faq.q} divider={index < faqs.length - 1}>
            {faq.a}
          </GroupedExpandableRow>
        ))}
      </GroupedListSection>

      <GroupedListSection title="Go there">
        <GroupedListRow
          primary="Devices"
          secondary="Connect and locate charge points"
          divider
          onClick={() => navigate(devices)}
        />
        {isNetwork ? (
          <GroupedListRow
            primary="Tariffs"
            secondary="Per-kWh pricing at device setup"
            divider
            onClick={() => navigate(SUPERADMIN_ROUTES.tariffs)}
          />
        ) : (
          <GroupedListRow
            primary="Vendor settings"
            secondary="MoMo or bank payout details"
            divider
            onClick={() => navigate(ADMIN_ROUTES.vendorSettings)}
          />
        )}
        <GroupedListRow
          primary="Reports"
          secondary="Export a sessions CSV"
          onClick={() => navigate(reports)}
        />
      </GroupedListSection>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 0.5, mt: 1 }}>
        Drivers use the in-app Help tab. This guide is for operators only.
      </Typography>
    </Box>
  );
}
