-- Remove sample Ghana demo charge points (IDs like CP-ACC-001, CP-WES-001, etc.)
-- Preserves all real hardware IDs (e.g. numeric serial-style IDs).
--
-- Usage (Render / production):
--   export DATABASE_URL='postgresql://...'
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/scripts/remove-demo-charge-points.sql
-- From backend/ with DATABASE_URL set:
--   npm run db:remove-demo-charge-points
--
-- Table name note: local auth versions table is local_auth_list_versions (plural).

BEGIN;

CREATE TEMP TABLE _demo_cps (id TEXT PRIMARY KEY);
INSERT INTO _demo_cps
SELECT charge_point_id
FROM charge_points
WHERE charge_point_id LIKE 'CP-%';

DELETE FROM wallet_transactions wt
WHERE wt.transaction_id IN (
  SELECT t.id FROM transactions t INNER JOIN _demo_cps d ON t.charge_point_id = d.id
);

DELETE FROM wallet_transactions wt
WHERE wt.payment_id IN (
  SELECT p.id
  FROM payments p
  WHERE p.transaction_id IN (
    SELECT t.id FROM transactions t INNER JOIN _demo_cps d ON t.charge_point_id = d.id
  )
);

DELETE FROM payments p
WHERE p.transaction_id IN (
  SELECT t.id FROM transactions t INNER JOIN _demo_cps d ON t.charge_point_id = d.id
);

DELETE FROM invoices i
WHERE i.transaction_id IN (
  SELECT t.id FROM transactions t INNER JOIN _demo_cps d ON t.charge_point_id = d.id
);

DELETE FROM meter_samples WHERE charge_point_id IN (SELECT id FROM _demo_cps);

DELETE FROM reservations WHERE charge_point_id IN (SELECT id FROM _demo_cps);
DELETE FROM firmware_jobs WHERE charge_point_id IN (SELECT id FROM _demo_cps);
DELETE FROM diagnostics_jobs WHERE charge_point_id IN (SELECT id FROM _demo_cps);
DELETE FROM charging_profiles WHERE charge_point_id IN (SELECT id FROM _demo_cps);
DELETE FROM pending_commands WHERE charge_point_id IN (SELECT id FROM _demo_cps);
DELETE FROM connection_logs WHERE charge_point_id IN (SELECT id FROM _demo_cps);
DELETE FROM connection_statistics WHERE charge_point_id IN (SELECT id FROM _demo_cps);
DELETE FROM local_auth_list WHERE charge_point_id IN (SELECT id FROM _demo_cps);
DELETE FROM local_auth_list_versions WHERE charge_point_id IN (SELECT id FROM _demo_cps);
DELETE FROM user_favorites WHERE charge_point_id IN (SELECT id FROM _demo_cps);
DELETE FROM config_keys WHERE charge_point_id IN (SELECT id FROM _demo_cps);

DELETE FROM transactions WHERE charge_point_id IN (SELECT id FROM _demo_cps);
DELETE FROM connectors WHERE charge_point_id IN (SELECT id FROM _demo_cps);
DELETE FROM charge_points WHERE charge_point_id IN (SELECT id FROM _demo_cps);

COMMIT;
