-- If a prior deployment added is_simulated for lab tooling, remove it in production.
ALTER TABLE connectors DROP COLUMN IF EXISTS is_simulated;
