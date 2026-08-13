import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedExpandableRow } from '../../components/ios/GroupedExpandableRow';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES } from '../../config/staffNav.paths';

const faqs = [
  {
    q: 'How do chargers appear in Devices?',
    a: 'A charge point shows up after it connects and sends BootNotification, or after you register it. Add coordinates so it also appears on the public Stations map.',
  },
  {
    q: 'How do I set pricing?',
    a: 'Open Tariffs and create a per-kWh plan. Network defaults apply when a vendor has no active tariff of their own.',
  },
  {
    q: 'Where do live sessions live vs history?',
    a: 'Operations is live stations (online, charging, offline). Sessions is the transaction list. Dashboard is the decision home for period revenue.',
  },
  {
    q: 'How do I export numbers?',
    a: 'Reports downloads a sessions CSV for the selected period. Analytics keeps live charts and breakdowns.',
  },
  {
    q: 'How do I jump with the keyboard?',
    a: 'Press ⌘K (Mac) or Ctrl+K (Windows) to search pages. Or press G, then a letter (shown next to each drawer item). Esc closes the jump menu. Touch users can open Jump to from the avatar menu.',
  },
];

export function StaffHelpPage({ variant = 'admin' }: { variant?: 'admin' | 'superadmin' }) {
  const navigate = useNavigate();
  const devices = variant === 'superadmin' ? SUPERADMIN_ROUTES.opsDevices : ADMIN_ROUTES.opsDevices;
  const tariffs = variant === 'superadmin' ? SUPERADMIN_ROUTES.tariffs : ADMIN_ROUTES.tariffs;
  const reports = variant === 'superadmin' ? SUPERADMIN_ROUTES.reports : ADMIN_ROUTES.reports;

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Operator guide"
        subtitle="Short answers for running chargers, pricing, and exports."
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
        <GroupedListRow
          primary="Tariffs"
          secondary="Per-kWh pricing"
          divider
          onClick={() => navigate(tariffs)}
        />
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
