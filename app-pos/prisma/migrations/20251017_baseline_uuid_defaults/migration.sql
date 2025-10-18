CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "User" ALTER COLUMN "userID" SET DEFAULT gen_random_uuid();
ALTER TABLE "Category" ALTER COLUMN "categoryID" SET DEFAULT gen_random_uuid();
ALTER TABLE "Menu" ALTER COLUMN "menuID" SET DEFAULT gen_random_uuid();
ALTER TABLE "Order" ALTER COLUMN "orderID" SET DEFAULT gen_random_uuid();
ALTER TABLE "Receipt" ALTER COLUMN "receiptID" SET DEFAULT gen_random_uuid();
ALTER TABLE "Report" ALTER COLUMN "reportID" SET DEFAULT gen_random_uuid();

-- ถ้า "SystemConfig"."configID" เป็น text ใน DB ให้ใช้แบบ text ด้วย (ปรับตามจริง)
-- ALTER TABLE "SystemConfig" ALTER COLUMN "configID" SET DEFAULT gen_random_uuid()::text;