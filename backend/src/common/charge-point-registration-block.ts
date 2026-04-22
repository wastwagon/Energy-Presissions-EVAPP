import { BadRequestException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BlockedChargePointId } from '../entities/blocked-charge-point-id.entity';

/** Env-only blocklist (ops / emergency). Comma-separated charge point IDs. */
export function parseBlockedChargePointIdsEnv(): Set<string> {
  const raw = process.env.BLOCKED_CHARGE_POINT_IDS ?? '';
  return new Set(
    raw
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  );
}

/**
 * Deny OCPP/internal upsert and REST create when the ID is env-blocked or admin-deleted (DB).
 */
export async function assertChargePointRegistrationAllowed(
  chargePointId: string,
  blockedRepo: Repository<BlockedChargePointId>,
  logger?: Logger,
): Promise<void> {
  if (parseBlockedChargePointIdsEnv().has(chargePointId)) {
    logger?.warn(`Blocked registration for ${chargePointId} (BLOCKED_CHARGE_POINT_IDS)`);
    throw new BadRequestException(
      `Charge point ${chargePointId} is blocked from registration (BLOCKED_CHARGE_POINT_IDS). Remove it from env when the device should be allowed.`,
    );
  }

  const tombstone = await blockedRepo.findOne({ where: { chargePointId } });
  if (tombstone) {
    logger?.warn(`Blocked OCPP upsert for ${chargePointId} (removed from platform)`);
    throw new BadRequestException(
      `Charge point ${chargePointId} was removed from the platform. Registration is blocked until a Super Admin clears the block for this ID.`,
    );
  }
}
