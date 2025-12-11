/**
 * OCPP 1.6 JSON-RPC 2.0 Message Types
 */

export enum OCPPMessageType {
  CALL = 2,
  CALLRESULT = 3,
  CALLERROR = 4,
  UNKNOWN = 0
}

/**
 * OCPP Message format:
 * [MessageType, MessageId, Action, Payload] for CALL
 * [MessageType, MessageId, Payload] for CALLRESULT
 * [MessageType, MessageId, ErrorCode, ErrorDescription, ErrorDetails] for CALLERROR
 */
export type OCPPMessage = [
  number, // MessageType
  string | null, // MessageId
  string?, // Action (for CALL) or ErrorCode (for CALLERROR)
  any?, // Payload or ErrorDescription
  any? // ErrorDetails (for CALLERROR)
];

/**
 * BootNotification payload
 */
export interface BootNotificationPayload {
  chargePointVendor: string;
  chargePointModel: string;
  chargePointSerialNumber?: string;
  firmwareVersion?: string;
  iccid?: string;
  imsi?: string;
  meterType?: string;
  meterSerialNumber?: string;
}

/**
 * BootNotification response
 */
export interface BootNotificationResponse {
  status: 'Accepted' | 'Pending' | 'Rejected';
  currentTime: string; // ISO 8601
  interval?: number; // Heartbeat interval in seconds
}

/**
 * Heartbeat response
 */
export interface HeartbeatResponse {
  currentTime: string; // ISO 8601
}

/**
 * StatusNotification payload
 */
export interface StatusNotificationPayload {
  connectorId: number; // 0 for charge point, 1..N for connectors
  errorCode: string;
  info?: string;
  status: 'Available' | 'Preparing' | 'Charging' | 'SuspendedEVSE' | 'SuspendedEV' | 'Finishing' | 'Reserved' | 'Unavailable' | 'Faulted';
  timestamp?: string; // ISO 8601
  vendorId?: string;
  vendorErrorCode?: string;
}

/**
 * Authorize payload
 */
export interface AuthorizePayload {
  idTag: string;
}

/**
 * IdTagInfo
 */
export interface IdTagInfo {
  status: 'Accepted' | 'Blocked' | 'Expired' | 'Invalid' | 'ConcurrentTx';
  expiryDate?: string; // ISO 8601
  parentIdTag?: string;
}

/**
 * Authorize response
 */
export interface AuthorizeResponse {
  idTagInfo: IdTagInfo;
}

/**
 * StartTransaction payload
 */
export interface StartTransactionPayload {
  connectorId: number;
  idTag: string;
  meterStart: number; // Wh
  reservationId?: number;
  timestamp: string; // ISO 8601
}

/**
 * StartTransaction response
 */
export interface StartTransactionResponse {
  transactionId: number;
  idTagInfo: IdTagInfo;
}

/**
 * MeterValues payload
 */
export interface MeterValuesPayload {
  connectorId: number;
  transactionId?: number;
  meterValue: MeterValue[];
}

export interface MeterValue {
  timestamp: string; // ISO 8601
  sampledValue: SampledValue[];
}

export interface SampledValue {
  value: string;
  context?: 'Sample.Periodic' | 'Sample.Clock' | 'Transaction.Begin' | 'Transaction.End' | 'Sample.Triggered' | 'Other';
  format?: 'Raw' | 'SignedData';
  measurand?: string; // e.g., "Energy.Active.Import.Register", "Power.Active.Import"
  location?: 'Cable' | 'EV' | 'Inlet' | 'Outlet' | 'Body';
  phase?: 'L1' | 'L2' | 'L3' | 'N' | 'L1-N' | 'L2-N' | 'L3-N' | 'L1-L2' | 'L2-L3' | 'L3-L1';
  unit?: string; // e.g., "Wh", "W", "V", "A"
}

/**
 * StopTransaction payload
 */
export interface StopTransactionPayload {
  transactionId: number;
  idTag?: string;
  meterStop: number; // Wh
  timestamp: string; // ISO 8601
  reason?: 'DeAuthorized' | 'EmergencyStop' | 'EVDisconnected' | 'HardReset' | 'Local' | 'Other' | 'PowerLoss' | 'Reboot' | 'Remote' | 'SoftReset' | 'UnlockCommand';
  transactionData?: MeterValue[];
}

/**
 * StopTransaction response
 */
export interface StopTransactionResponse {
  idTagInfo?: IdTagInfo;
}

/**
 * Reset request payload
 */
export interface ResetPayload {
  type: 'Hard' | 'Soft';
}

/**
 * Reset response
 */
export interface ResetResponse {
  status: 'Accepted' | 'Rejected';
}

/**
 * ClearCache response
 */
export interface ClearCacheResponse {
  status: 'Accepted' | 'Rejected';
}

/**
 * ReserveNow payload
 */
export interface ReserveNowPayload {
  connectorId: number;
  expiryDate: string; // ISO 8601
  idTag: string;
  reservationId: number;
  parentIdTag?: string;
}

/**
 * ReserveNow response
 */
export interface ReserveNowResponse {
  status: 'Accepted' | 'Faulted' | 'Occupied' | 'Rejected' | 'Unavailable';
}

/**
 * CancelReservation payload
 */
export interface CancelReservationPayload {
  reservationId: number;
}

/**
 * CancelReservation response
 */
export interface CancelReservationResponse {
  status: 'Accepted' | 'Rejected';
}

/**
 * SendLocalList payload
 */
export interface SendLocalListPayload {
  listVersion: number;
  localAuthorizationList?: LocalAuthorizationListEntry[];
  updateType: 'Full' | 'Differential';
}

export interface LocalAuthorizationListEntry {
  idTag: string;
  idTagInfo: IdTagInfo;
}

/**
 * SendLocalList response
 */
export interface SendLocalListResponse {
  status: 'Accepted' | 'Failed' | 'NotSupported' | 'VersionMismatch';
}

/**
 * GetLocalListVersion response
 */
export interface GetLocalListVersionResponse {
  listVersion: number;
}

/**
 * SetChargingProfile payload
 */
export interface SetChargingProfilePayload {
  connectorId: number;
  chargingProfile: ChargingProfile;
}

export interface ChargingProfile {
  chargingProfileId: number;
  transactionId?: number;
  stackLevel: number;
  chargingProfilePurpose: 'ChargePointMaxProfile' | 'TxDefaultProfile' | 'TxProfile';
  chargingProfileKind: 'Absolute' | 'Recurring' | 'Relative';
  recurrencyKind?: 'Daily' | 'Weekly';
  validFrom?: string; // ISO 8601
  validTo?: string; // ISO 8601
  chargingSchedule: ChargingSchedule;
}

export interface ChargingSchedule {
  duration?: number;
  startSchedule?: string; // ISO 8601
  chargingRateUnit: 'A' | 'W';
  chargingSchedulePeriod: ChargingSchedulePeriod[];
  minChargingRate?: number;
}

export interface ChargingSchedulePeriod {
  startPeriod: number;
  limit: number;
  numberPhases?: number;
}

/**
 * SetChargingProfile response
 */
export interface SetChargingProfileResponse {
  status: 'Accepted' | 'Rejected' | 'NotSupported';
}

/**
 * ClearChargingProfile payload
 */
export interface ClearChargingProfilePayload {
  id?: number; // chargingProfileId
  connectorId?: number;
  chargingProfilePurpose?: 'ChargePointMaxProfile' | 'TxDefaultProfile' | 'TxProfile';
  stackLevel?: number;
}

/**
 * ClearChargingProfile response
 */
export interface ClearChargingProfileResponse {
  status: 'Accepted' | 'Unknown';
}

/**
 * GetCompositeSchedule payload
 */
export interface GetCompositeSchedulePayload {
  connectorId: number;
  duration: number;
  chargingRateUnit?: 'A' | 'W';
}

/**
 * GetCompositeSchedule response
 */
export interface GetCompositeScheduleResponse {
  status: 'Accepted' | 'Rejected';
  connectorId?: number;
  scheduleStart?: string; // ISO 8601
  chargingSchedule?: ChargingSchedule;
}

/**
 * UpdateFirmware payload
 */
export interface UpdateFirmwarePayload {
  location: string; // URL
  retrieveDate: string; // ISO 8601
  retryInterval?: number;
  retries?: number;
}

/**
 * UpdateFirmware response
 */
export interface UpdateFirmwareResponse {
  status: 'Accepted' | 'Rejected' | 'AcceptedCanceled' | 'InvalidCertificate' | 'RevokedCertificate';
}

/**
 * GetDiagnostics payload
 */
export interface GetDiagnosticsPayload {
  location: string; // URL
  startTime?: string; // ISO 8601
  stopTime?: string; // ISO 8601
  retryInterval?: number;
  retries?: number;
}

/**
 * GetDiagnostics response
 */
export interface GetDiagnosticsResponse {
  status: 'Accepted' | 'Rejected';
  fileName?: string;
}

/**
 * DataTransfer payload
 */
export interface DataTransferPayload {
  vendorId: string;
  messageId?: string;
  data?: string;
}

/**
 * DataTransfer response
 */
export interface DataTransferResponse {
  status: 'Accepted' | 'Rejected' | 'UnknownMessageId' | 'UnknownVendorId';
  data?: string;
}

