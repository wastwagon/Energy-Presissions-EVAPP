/**
 * Ghana site cellular guidance for OCPP chargers using a 4G/LTE SIM.
 * Operations standard: MTN primary; Vodafone / AirtelTigo as alternatives. Telecel is not used.
 */

export type CellularProviderId = 'MTN' | 'Vodafone' | 'AirtelTigo' | 'Other';

export const CELLULAR_PROVIDER_OPTIONS: Array<{
  id: CellularProviderId;
  label: string;
  recommended?: boolean;
  apn: string;
  notes: string;
}> = [
  {
    id: 'MTN',
    label: 'MTN Ghana',
    recommended: true,
    apn: 'internet',
    notes: 'Primary choice for new site SIMs. Username/password usually blank. Confirm with your MTN IoT/M2M plan.',
  },
  {
    id: 'Vodafone',
    label: 'Vodafone Ghana',
    apn: 'internet',
    notes: 'Alternative if MTN coverage is weak at the site.',
  },
  {
    id: 'AirtelTigo',
    label: 'AirtelTigo',
    apn: 'internet',
    notes: 'Alternative where AirtelTigo has stronger signal.',
  },
  {
    id: 'Other',
    label: 'Other / manual',
    apn: '',
    notes: 'Enter APN from your carrier. Do not provision Telecel SIMs for this platform.',
  },
];

export const CELLULAR_OPS_SUMMARY =
  'Use an MTN data SIM for charger backhaul when possible. Vodafone or AirtelTigo are acceptable alternatives. Telecel is not part of our deployment standard.';

export function getCellularPreset(providerId: CellularProviderId) {
  return CELLULAR_PROVIDER_OPTIONS.find((p) => p.id === providerId);
}
