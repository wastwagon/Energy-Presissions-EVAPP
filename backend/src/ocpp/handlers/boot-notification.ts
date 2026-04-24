import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { BootNotificationPayload, BootNotificationResponse, OCPPMessage } from '../types/ocpp-message';
import axios from 'axios';

export class BootNotificationHandler {
  constructor(private connectionManager: ConnectionManager) {}

  /** OCPP 1.6J uses chargePointSerialNumber; some firmware uses alternate keys or path-only /ocpp without a serial. */
  private resolveActualChargePointId(
    connectionLabel: string,
    payload: BootNotificationPayload,
  ): { id: string; fromPayload: string | null } {
    if (!connectionLabel.startsWith('temp_')) {
      return { id: connectionLabel, fromPayload: null };
    }
    const p = payload as unknown as Record<string, unknown>;
    const trim = (s: unknown) => (typeof s === 'string' ? s.trim() : '');

    let candidate =
      trim(payload.chargePointSerialNumber) ||
      (typeof p['chargePointSerial'] === 'string' ? trim(p['chargePointSerial']) : '') ||
      (typeof p['cpSerial'] === 'string' ? trim(p['cpSerial']) : '');

    if (!candidate) {
      const m = trim(payload.chargePointModel);
      if (m && /^\d{10,24}$/.test(m)) {
        candidate = m;
        logger.info(`Using numeric chargePointModel as identity for ${connectionLabel}`);
      }
    }

    if (candidate) {
      return { id: candidate, fromPayload: 'BootNotification' };
    }
    return { id: connectionLabel, fromPayload: null };
  }

  async handle(chargePointId: string, messageId: string, payload: BootNotificationPayload, ws?: any): Promise<void> {
    let { id: actualChargePointId, fromPayload } = this.resolveActualChargePointId(chargePointId, payload);

    if (chargePointId.startsWith('temp_')) {
      if (!fromPayload) {
        logger.error(
          `BootNotification: cannot determine charge point id. Use wss://…/ocpp/{yourChargePointId} on the device, or ensure Boot includes chargePointSerialNumber (OCPP 1.6J). temp=${chargePointId}`,
        );
        const ocppErr: OCPPMessage = [3, messageId, { status: 'Rejected', currentTime: new Date().toISOString() } as any];
        if (ws) {
          this.connectionManager.sendMessage(chargePointId, ocppErr);
        }
        return;
      }
      logger.info(`Mapping temporary connection ${chargePointId} to charge point id: ${actualChargePointId}`);
      if (ws) {
        const mapped = this.connectionManager.mapConnectionToChargePointId(ws, actualChargePointId);
        if (!mapped) {
          logger.error(`Failed to map connection from ${chargePointId} to ${actualChargePointId}`);
          const ocppErr: OCPPMessage = [3, messageId, { status: 'Rejected', currentTime: new Date().toISOString() } as any];
          this.connectionManager.sendMessage(chargePointId, ocppErr);
          return;
        }
      }
    }

    logger.info(`Processing BootNotification from ${actualChargePointId}`, payload);
    logger.info(`BootNotification Details:`, {
      chargePointId: actualChargePointId,
      originalChargePointId: chargePointId,
      vendor: payload.chargePointVendor,
      model: payload.chargePointModel,
      serialNumber: payload.chargePointSerialNumber,
      firmwareVersion: payload.firmwareVersion,
      iccid: payload.iccid,
      imsi: payload.imsi,
    });

    try {
      // Notify CSMS API about charge point registration
      await this.notifyCSMS(actualChargePointId, payload);

      // Send response
      const response: BootNotificationResponse = {
        status: 'Accepted',
        currentTime: new Date().toISOString(),
        interval: 300 // Default heartbeat interval: 5 minutes
      };

      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        response as any
      ];

      this.connectionManager.sendMessage(actualChargePointId, ocppResponse);
      logger.info(`BootNotification accepted for ${actualChargePointId}`);
    } catch (error) {
      logger.error(`Error processing BootNotification from ${actualChargePointId}:`, error);
      
      // Send rejection
      const response: BootNotificationResponse = {
        status: 'Rejected',
        currentTime: new Date().toISOString()
      };

      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        response as any
      ];

      this.connectionManager.sendMessage(actualChargePointId, ocppResponse);
    }
  }

  private async notifyCSMS(chargePointId: string, payload: BootNotificationPayload): Promise<void> {
    const port = process.env.PORT || '3000';
    const csmsApiUrl = (process.env.CSMS_API_URL || `http://127.0.0.1:${port}`).replace(/\/$/, '');
    
    const dataToSend = {
      chargePointId,
      vendor: payload.chargePointVendor,
      model: payload.chargePointModel,
      serialNumber: payload.chargePointSerialNumber,
      firmwareVersion: payload.firmwareVersion,
      iccid: payload.iccid,
      imsi: payload.imsi
    };
    
    logger.info(`Sending BootNotification data to CSMS API:`, dataToSend);
    
    try {
      const res = await axios.post(`${csmsApiUrl}/api/internal/charge-points`, dataToSend, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });
      if (res.status >= 200 && res.status < 300) {
        logger.info(
          `BootNotification CSMS upsert OK: chargePointId=${chargePointId} httpStatus=${res.status}`,
        );
      } else {
        const detail =
          typeof res.data === 'object' && res.data !== null
            ? JSON.stringify(res.data)
            : String(res.data);
        const msg = `BootNotification CSMS upsert FAILED: chargePointId=${chargePointId} httpStatus=${res.status} body=${detail.slice(0, 500)}`;
        logger.error(msg);
        throw new Error(msg);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const d = error.response.data;
        const body =
          typeof d === 'object' && d !== null ? JSON.stringify(d) : String(d);
        logger.error(
          `BootNotification CSMS upsert FAILED: chargePointId=${chargePointId} httpStatus=${error.response.status} (check SERVICE_TOKEN / CSMS_API_URL) body=${String(body).slice(0, 500)}`,
        );
      } else {
        logger.error(`Failed to notify CSMS API about charge point ${chargePointId}:`, error);
      }
      throw error;
    }
  }
}

