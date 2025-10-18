-- Align migration history with DB: SystemConfig.configID default = gen_random_uuid()
-- Safe to run even if already set.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'SystemConfig'
      AND column_name = 'configID'
  ) THEN
    RAISE NOTICE 'SystemConfig.configID column not found; skipping default adjustment.';
  ELSE
    EXECUTE 'ALTER TABLE "SystemConfig" ALTER COLUMN "configID" SET DEFAULT gen_random_uuid();';
  END IF;
END$$;

