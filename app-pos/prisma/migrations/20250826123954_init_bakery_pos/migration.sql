-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('Owner', 'Staff');

-- CreateTable
CREATE TABLE "public"."User" (
    "userID" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userID")
);

-- CreateTable
CREATE TABLE "public"."SystemConfig" (
    "configID" TEXT NOT NULL,
    "taxRatePct" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "defaultDiscountPct" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'THB',

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("configID")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "categoryID" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("categoryID")
);

-- CreateTable
CREATE TABLE "public"."Menu" (
    "menuID" TEXT NOT NULL,
    "menuName" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "menuDetail" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("menuID")
);

-- CreateTable
CREATE TABLE "public"."Menu_Category" (
    "menuID" TEXT NOT NULL,
    "categoryID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_Category_pkey" PRIMARY KEY ("menuID","categoryID")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "orderID" TEXT NOT NULL,
    "orderDescription" TEXT,
    "orderDateTime" TIMESTAMP(3) NOT NULL,
    "userID" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("orderID")
);

-- CreateTable
CREATE TABLE "public"."Order_Menu" (
    "orderID" TEXT NOT NULL,
    "menuID" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_Menu_pkey" PRIMARY KEY ("orderID","menuID")
);

-- CreateTable
CREATE TABLE "public"."Receipt" (
    "receiptID" TEXT NOT NULL,
    "orderID" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL,
    "grandTotal" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "changeAmount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("receiptID")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "reportID" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "reportType" TEXT NOT NULL,
    "totalSales" DECIMAL(12,2) NOT NULL,
    "numberOfOrders" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("reportID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_orderID_key" ON "public"."Receipt"("orderID");

-- AddForeignKey
ALTER TABLE "public"."Menu_Category" ADD CONSTRAINT "Menu_Category_menuID_fkey" FOREIGN KEY ("menuID") REFERENCES "public"."Menu"("menuID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Menu_Category" ADD CONSTRAINT "Menu_Category_categoryID_fkey" FOREIGN KEY ("categoryID") REFERENCES "public"."Category"("categoryID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order_Menu" ADD CONSTRAINT "Order_Menu_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES "public"."Order"("orderID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order_Menu" ADD CONSTRAINT "Order_Menu_menuID_fkey" FOREIGN KEY ("menuID") REFERENCES "public"."Menu"("menuID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Receipt" ADD CONSTRAINT "Receipt_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES "public"."Order"("orderID") ON DELETE RESTRICT ON UPDATE CASCADE;
