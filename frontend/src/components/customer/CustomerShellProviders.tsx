import type { ReactNode } from 'react';
import { CustomerPullRefreshProvider } from '../../contexts/CustomerPullRefreshContext';
import { PullToRefresh } from '../ios/PullToRefresh';

type CustomerScrollProvidersProps = {
  children: ReactNode;
  scrollTargetId: string;
};

/** Pull-to-refresh wrapper for customer scroll regions (pages register via `useCustomerPullRefresh`). */
export function CustomerScrollProviders({ children, scrollTargetId }: CustomerScrollProvidersProps) {
  return (
    <CustomerPullRefreshProvider>
      <PullToRefresh scrollTargetId={scrollTargetId}>{children}</PullToRefresh>
    </CustomerPullRefreshProvider>
  );
}
