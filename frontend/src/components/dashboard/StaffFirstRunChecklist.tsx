import { useNavigate } from 'react-router-dom';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedListRow } from '../ios/GroupedListRow';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES } from '../../config/staffNav.paths';

export function StaffFirstRunChecklist({
  variant,
}: {
  variant: 'admin' | 'vendor' | 'superadmin';
}) {
  const navigate = useNavigate();
  const isNetwork = variant === 'superadmin';

  const steps = isNetwork
    ? [
        {
          primary: 'Add a vendor',
          secondary: 'Onboard an operator before chargers can belong to a network.',
          onClick: () => navigate(SUPERADMIN_ROUTES.vendors),
        },
        {
          primary: 'Set network tariffs',
          secondary: 'Per-kWh pricing at commission. Vendors cannot change rates.',
          onClick: () => navigate(SUPERADMIN_ROUTES.tariffs),
        },
        {
          primary: 'Wait for the first charger',
          secondary: 'Devices appear after BootNotification. Open Devices to confirm.',
          onClick: () => navigate(SUPERADMIN_ROUTES.opsDevices),
        },
      ]
    : [
        {
          primary: 'Complete vendor profile',
          secondary: 'Business name, logo, and receipt copy.',
          onClick: () => navigate(ADMIN_ROUTES.vendorSettings),
        },
        {
          primary: 'Add payout details',
          secondary: 'MoMo or bank account so Clean Motion can pay you on the scheduled cycle.',
          onClick: () => navigate(ADMIN_ROUTES.vendorSettings),
        },
        {
          primary: 'Connect the first charger',
          secondary: 'It appears after BootNotification. Add coordinates for the public map.',
          onClick: () => navigate(ADMIN_ROUTES.opsDevices),
        },
      ];

  return (
    <GroupedListSection title="Get started">
      {steps.map((step, index) => (
        <GroupedListRow
          key={step.primary}
          primary={`${index + 1}. ${step.primary}`}
          secondary={step.secondary}
          divider={index < steps.length - 1}
          onClick={step.onClick}
        />
      ))}
    </GroupedListSection>
  );
}
