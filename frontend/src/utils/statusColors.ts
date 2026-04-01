type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

export function getChargePointStatusColor(status: string): ChipColor {
  switch (status.toLowerCase()) {
    case 'available':
      return 'success';
    case 'charging':
    case 'preparing':
    case 'finishing':
      return 'info';
    case 'faulted':
      return 'error';
    case 'offline':
    case 'unavailable':
      return 'default';
    default:
      return 'warning';
  }
}

export function getTransactionStatusColor(status: string): ChipColor {
  switch (status.toLowerCase()) {
    case 'active':
      return 'info';
    case 'completed':
    case 'succeeded':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
}

export function getPaymentStatusColor(status: string): ChipColor {
  switch (status.toLowerCase()) {
    case 'succeeded':
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
}

export function getVendorStatusColor(status: string): ChipColor {
  switch (status.toLowerCase()) {
    case 'active':
      return 'success';
    case 'suspended':
      return 'warning';
    case 'disabled':
      return 'error';
    default:
      return 'default';
  }
}

export function getWalletTransactionTypeColor(type: string): ChipColor {
  switch (type.toLowerCase()) {
    case 'topup':
    case 'top_up':
    case 'credit':
    case 'refund':
      return 'success';
    case 'payment':
    case 'debit':
      return 'error';
    case 'adjustment':
      return 'warning';
    default:
      return 'default';
  }
}

export function getUserAccountStatusColor(status: string): ChipColor {
  switch (status.toLowerCase()) {
    case 'active':
      return 'success';
    case 'suspended':
      return 'warning';
    case 'inactive':
      return 'default';
    default:
      return 'default';
  }
}

export function getConnectionEventColor(eventType: string): ChipColor {
  const normalized = eventType.toLowerCase();
  if (normalized === 'error' || normalized === 'connection_failed') return 'error';
  if (normalized === 'connection_success') return 'success';
  return 'default';
}

export function getConnectionStatusColor(status: string): ChipColor {
  const normalized = status.toLowerCase();
  if (normalized === 'failed' || normalized === 'error') return 'error';
  if (normalized === 'success') return 'success';
  return 'default';
}

export function getInvoiceStatusColor(status: string): ChipColor {
  const normalized = status.toLowerCase();
  if (normalized === 'paid' || normalized === 'settled' || normalized === 'completed') {
    return 'success';
  }
  if (normalized === 'pending' || normalized === 'open') {
    return 'warning';
  }
  if (normalized === 'overdue' || normalized === 'failed' || normalized === 'cancelled') {
    return 'error';
  }
  return 'default';
}
