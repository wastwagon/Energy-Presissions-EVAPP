import type { ReactNode } from 'react';
import { CustomerScrollProviders } from '../customer/CustomerShellProviders';

type StaffScrollProvidersProps = {
  children: ReactNode;
  scrollTargetId: string;
};

/** Pull-to-refresh for admin / superadmin / vendor scroll regions (reuses customer PTR context). */
export function StaffScrollProviders({ children, scrollTargetId }: StaffScrollProvidersProps) {
  return <CustomerScrollProviders scrollTargetId={scrollTargetId}>{children}</CustomerScrollProviders>;
}
