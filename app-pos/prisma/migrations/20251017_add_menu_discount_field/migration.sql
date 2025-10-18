-- Add per-menu discount fields to Menu (idempotent)

ALTER TABLE "Menu"
  ADD COLUMN IF NOT EXISTS "discountType" text NOT NULL DEFAULT 'THB',
  ADD COLUMN IF NOT EXISTS "discountValue" numeric(10,2) NOT NULL DEFAULT 0;

