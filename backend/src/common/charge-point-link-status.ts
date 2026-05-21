/**
 * CSMS link (WebSocket + heartbeat) vs OCPP operational status (Available, Charging, …).
 */

export type ChargePointLinkStatus = 'online' | 'stale' | 'offline' | 'never_seen';

export interface ChargePointLinkInfo {
  linkStatus: ChargePointLinkStatus;
  ocppConnected: boolean;
  secondsSinceHeartbeat: number | null;
  heartbeatStale: boolean;
}

const DEFAULT_HEARTBEAT_INTERVAL_SEC = 300;
const MIN_STALE_THRESHOLD_SEC = 600;

export function getHeartbeatStaleThresholdSec(heartbeatInterval?: number | null): number {
  const interval =
    typeof heartbeatInterval === 'number' && heartbeatInterval > 0
      ? heartbeatInterval
      : DEFAULT_HEARTBEAT_INTERVAL_SEC;
  return Math.max(interval * 2, MIN_STALE_THRESHOLD_SEC);
}

export function computeChargePointLinkInfo(
  cp: { lastHeartbeat?: Date | string | null; heartbeatInterval?: number | null },
  ocppConnected: boolean,
  nowMs: number = Date.now(),
): ChargePointLinkInfo {
  const staleThresholdSec = getHeartbeatStaleThresholdSec(cp.heartbeatInterval);

  let secondsSinceHeartbeat: number | null = null;
  if (cp.lastHeartbeat) {
    const hb = new Date(cp.lastHeartbeat).getTime();
    if (!Number.isNaN(hb)) {
      secondsSinceHeartbeat = Math.max(0, Math.floor((nowMs - hb) / 1000));
    }
  }

  const heartbeatStale =
    secondsSinceHeartbeat === null || secondsSinceHeartbeat > staleThresholdSec;

  if (ocppConnected) {
    return {
      linkStatus: 'online',
      ocppConnected: true,
      secondsSinceHeartbeat,
      heartbeatStale,
    };
  }

  if (secondsSinceHeartbeat === null) {
    return {
      linkStatus: 'never_seen',
      ocppConnected: false,
      secondsSinceHeartbeat,
      heartbeatStale: true,
    };
  }

  if (!heartbeatStale) {
    return {
      linkStatus: 'stale',
      ocppConnected: false,
      secondsSinceHeartbeat,
      heartbeatStale: false,
    };
  }

  return {
    linkStatus: 'offline',
    ocppConnected: false,
    secondsSinceHeartbeat,
    heartbeatStale: true,
  };
}
