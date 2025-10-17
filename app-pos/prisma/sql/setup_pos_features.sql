-- =========================================================
-- STEP 1: ลบของเก่าทั้งหมด (Procedure ทุก signature)
-- =========================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT proname, oidvectortypes(proargtypes) AS args
    FROM pg_proc
    WHERE proname = 'create_receipt_for_order'
  LOOP
    EXECUTE format('DROP PROCEDURE IF EXISTS create_receipt_for_order(%s);', r.args);
  END LOOP;
END$$;

-- ลบ function / trigger / cron เดิม
DROP FUNCTION IF EXISTS trg_receipt_enforce_calc() CASCADE;
DROP FUNCTION IF EXISTS rollup_daily_sales(date) CASCADE;
SELECT cron.unschedule('mini_pos_daily_report');

-- =========================================================
-- STEP 2: สร้างใหม่ทั้งหมด (Production Ready)
-- =========================================================

-- Stored Procedure: create_receipt_for_order
CREATE OR REPLACE PROCEDURE create_receipt_for_order(
  p_order_id UUID,
  p_amount_paid NUMERIC,
  p_payment_method TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_subtotal NUMERIC(12,2);
  v_discount NUMERIC(12,2);
  v_tax NUMERIC(12,2);
  v_grandtotal NUMERIC(12,2);
  v_config RECORD;
BEGIN
  -- ป้องกันออกใบซ้ำ
  PERFORM pg_advisory_xact_lock(hashtext(p_order_id::text));

  -- โหลด config
  SELECT * INTO v_config FROM "SystemConfig" LIMIT 1;

  -- เทียบ UUID กับ UUID ตรง ๆ (ไม่มี ::text)
  SELECT SUM(m."price" * om."quantity")
  INTO v_subtotal
  FROM "Order_Menu" om
  JOIN "Menu" m ON m."menuID" = om."menuID"
  WHERE om."orderID"::uuid = p_order_id;

  IF v_subtotal IS NULL THEN
    RAISE EXCEPTION 'Order % has no items in Order_Menu', p_order_id;
  END IF;

  -- คำนวณส่วนลด / ภาษี / ยอดรวม
  v_discount := COALESCE(v_subtotal * (v_config."defaultDiscountPct"/100), 0);
  v_tax := COALESCE((v_subtotal - v_discount) * (v_config."taxRatePct"/100), 0);
  v_grandtotal := v_subtotal - v_discount + v_tax;

  -- ตรวจสอบยอดชำระ
  IF p_amount_paid < v_grandtotal THEN
    RAISE EXCEPTION 'Amount paid (%.2f) less than grand total (%.2f)',
      p_amount_paid, v_grandtotal;
  END IF;

  -- สร้างใบเสร็จ
  INSERT INTO "Receipt" (
    "receiptID", "orderID", "receiptDate", "subtotal", "discountAmount", "taxAmount",
    "grandTotal", "amountPaid", "changeAmount", "paymentMethod", "createdAt", "updatedAt"
  )
  VALUES (
    gen_random_uuid(),
    p_order_id, now(), v_subtotal, v_discount, v_tax,
    v_grandtotal, p_amount_paid, p_amount_paid - v_grandtotal,
    p_payment_method::"PaymentMethod", now(), now()
  );
END;
$$;

-- =========================================================
-- Trigger Function: trg_receipt_enforce_calc
-- =========================================================
CREATE OR REPLACE FUNCTION trg_receipt_enforce_calc()
RETURNS TRIGGER AS $$
BEGIN
  NEW."grandTotal" := NEW."subtotal" - NEW."discountAmount" + NEW."taxAmount";
  IF NEW."amountPaid" < NEW."grandTotal" THEN
    RAISE EXCEPTION 'AmountPaid (%.2f) cannot be less than GrandTotal (%.2f)',
      NEW."amountPaid", NEW."grandTotal";
  END IF;
  NEW."changeAmount" := NEW."amountPaid" - NEW."grandTotal";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to Receipt
DROP TRIGGER IF EXISTS trg_receipt_enforce_calc ON "Receipt";
CREATE TRIGGER trg_receipt_enforce_calc
BEFORE INSERT OR UPDATE ON "Receipt"
FOR EACH ROW
EXECUTE FUNCTION trg_receipt_enforce_calc();

-- =========================================================
-- Daily Rollup Function: rollup_daily_sales
-- =========================================================
CREATE OR REPLACE FUNCTION rollup_daily_sales(p_day date)
RETURNS void AS $$
DECLARE
  v_total NUMERIC(12,2);
  v_count INT;
BEGIN
  SELECT SUM("grandTotal"), COUNT(*)
  INTO v_total, v_count
  FROM "Receipt"
  WHERE ("receiptDate" AT TIME ZONE 'Asia/Bangkok')::date = p_day;

  INSERT INTO "Report" (
    "reportID", "reportDate", "reportType",
    "totalSales", "numberOfOrders", "createdAt", "updatedAt"
  )
  VALUES (
    gen_random_uuid(),
    p_day,
    'DAILY',
    COALESCE(v_total, 0),
    COALESCE(v_count, 0),
    now(),
    now()
  )
  ON CONFLICT ON CONSTRAINT "uniq_report_date_type"
  DO UPDATE SET
    "totalSales" = EXCLUDED."totalSales",
    "numberOfOrders" = EXCLUDED."numberOfOrders",
    "updatedAt" = now();
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- pg_cron Schedule: mini_pos_daily_report (run 2:00 AM)
-- =========================================================
SELECT cron.schedule(
  'mini_pos_daily_report',
  '5 19 * * *',
  $$ SELECT rollup_daily_sales(((now() AT TIME ZONE 'Asia/Bangkok')::date - 1)); $$
);
