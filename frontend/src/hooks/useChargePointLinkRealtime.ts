import { useEffect } from 'react';
import { websocketService } from '../services/websocket';
import type { ChargePoint } from '../services/chargePointsApi';

export type ChargePointLinkRealtimePayload = {
  chargePointId: string;
  status?: string;
  lastSeen?: string;
  lastHeartbeat?: string;
  linkStatus?: ChargePoint['linkStatus'];
  ocppConnected?: boolean;
  secondsSinceHeartbeat?: number | null;
  heartbeatStale?: boolean;
};

/** Merge Socket.IO chargePointStatus events (includes CSMS link fields). */
export function useChargePointLinkRealtime(
  onUpdate: (payload: ChargePointLinkRealtimePayload) => void,
): void {
  useEffect(() => {
    const unsubscribe = websocketService.on('chargePointStatus', (event) => {
      const data = event.data as ChargePointLinkRealtimePayload | undefined;
      if (data?.chargePointId) {
        onUpdate(data);
      }
    });
    return unsubscribe;
  }, [onUpdate]);
}

export function mergeChargePointLinkUpdate<T extends ChargePoint>(
  list: T[],
  payload: ChargePointLinkRealtimePayload,
): T[] {
  const idx = list.findIndex((cp) => cp.chargePointId === payload.chargePointId);
  if (idx < 0) {
    return list;
  }
  const next = [...list];
  next[idx] = { ...next[idx], ...payload };
  return next;
}

export function buildLinkStatusMap(
  chargePoints: Pick<ChargePoint, 'chargePointId' | 'linkStatus' | 'ocppConnected' | 'secondsSinceHeartbeat'>[],
): Map<string, Pick<ChargePoint, 'linkStatus' | 'ocppConnected' | 'secondsSinceHeartbeat'>> {
  const map = new Map<
    string,
    Pick<ChargePoint, 'linkStatus' | 'ocppConnected' | 'secondsSinceHeartbeat'>
  >();
  for (const cp of chargePoints) {
    map.set(cp.chargePointId, {
      linkStatus: cp.linkStatus,
      ocppConnected: cp.ocppConnected,
      secondsSinceHeartbeat: cp.secondsSinceHeartbeat,
    });
  }
  return map;
}
