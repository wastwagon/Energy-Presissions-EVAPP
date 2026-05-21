# Charger cellular backhaul (Ghana)

Site OCPP chargers often use a **4G/LTE data SIM** in the cabinet modem. This document is the operations standard for Energy Presissions EVAP.

## Operator policy

| Operator | Use |
|----------|-----|
| **MTN Ghana** | **Primary** — provision new site SIMs on MTN unless coverage forces otherwise |
| Vodafone Ghana | Acceptable alternative |
| AirtelTigo | Acceptable alternative |
| **Telecel** | **Not used** on this platform |

Customer **mobile money** (Paystack) may still list multiple networks; that is separate from **charger backhaul SIMs**.

## Typical APN (verify with your M2M plan)

| Operator | APN (common) | Username / password |
|----------|----------------|---------------------|
| MTN | `internet` | Usually blank |
| Vodafone | `internet` | Usually blank |
| AirtelTigo | `internet` | Usually blank |

Confirm with your carrier or modem manufacturer before field rollout.

## CSMS fields

- **ICCID / IMSI** — filled from OCPP `BootNotification` when the charger reports them.
- **SIM operator / APN** — set in **Ops → Devices → [charger] → Settings** (`cellular_provider`, `cellular_apn` in DB).

Migration: `database/init/10-charge-point-cellular.sql`

## Troubleshooting offline chargers

1. Power and antenna at the cabinet.
2. SIM active and has data; correct APN on the modem.
3. Prefer **MTN** SIM if the site was on an unsupported operator.
4. CSMS **link status** (WebSocket) vs **OCPP status** on the device detail page.
