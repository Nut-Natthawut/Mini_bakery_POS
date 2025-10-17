-- Baseline migration to align migration history with the actual DB schema
-- Adds the unique index used by rollup (idempotent)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_indexes
    WHERE  schemaname = 'public'
    AND    indexname  = 'uniq_report_date_type'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX "uniq_report_date_type" ON "Report"("reportDate", "reportType")';
  END IF;
END$$;

