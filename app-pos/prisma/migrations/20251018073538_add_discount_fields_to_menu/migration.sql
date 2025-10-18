-- AlterTable
ALTER TABLE "public"."Menu" ADD COLUMN     "discountType" TEXT NOT NULL DEFAULT 'THB',
ADD COLUMN     "discountValue" DECIMAL(10,2) NOT NULL DEFAULT 0;
