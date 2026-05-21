-- Optional vendor scope for tariffs (NULL = network-wide default)
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS vendor_id INTEGER NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tariffs_vendor_id'
  ) THEN
    ALTER TABLE tariffs
      ADD CONSTRAINT fk_tariffs_vendor_id
      FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tariffs_vendor_id ON tariffs(vendor_id);
