import type { ChargePoint } from '../services/chargePointsApi';

export type ChargePointLinkStatus = 'online' | 'stale' | 'offline' | 'never_seen';

export function formatSecondsSinceHeartbeat(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) {
    return 'No heartbeat';
  }
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function getLinkStatusLabel(linkStatus: string | undefined): string {
  switch (linkStatus) {
    case 'online':
      return 'Online';
    case 'stale':
      return 'Recently offline';
    case 'offline':
      return 'Offline';
    case 'never_seen':
      return 'Never connected';
    default:
      return 'Unknown';
  }
}

export function getLinkStatusChipColor(
  linkStatus: string | undefined,
): 'success' | 'warning' | 'error' | 'default' {
  switch (linkStatus) {
    case 'online':
      return 'success';
    case 'stale':
      return 'warning';
    case 'offline':
      return 'error';
    case 'never_seen':
      return 'default';
    default:
      return 'default';
  }
}

export function getLinkStatusTooltip(cp: ChargePoint): string {
  const label = getLinkStatusLabel(cp.linkStatus);
  const hb = formatSecondsSinceHeartbeat(cp.secondsSinceHeartbeat ?? null);
  const ws = cp.ocppConnected ? 'WebSocket open' : 'WebSocket closed';
  const stale = cp.heartbeatStale ? 'Heartbeat overdue' : 'Heartbeat within interval';
  return `${label} — ${ws}. Last heartbeat: ${hb}. ${stale}. OCPP status "${cp.status}" is separate.`;
}

export function countByLinkStatus(
  chargePoints: Pick<ChargePoint, 'linkStatus'>[],
): Record<ChargePointLinkStatus, number> {
  const counts: Record<ChargePointLinkStatus, number> = {
    online: 0,
    stale: 0,
    offline: 0,
    never_seen: 0,
  };
  for (const cp of chargePoints) {
    const key = (cp.linkStatus as ChargePointLinkStatus) || 'never_seen';
    if (key in counts) {
      counts[key] += 1;
    }
  }
  return counts;
}
