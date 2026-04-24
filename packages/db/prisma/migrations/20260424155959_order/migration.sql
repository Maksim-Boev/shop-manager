-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'FULFILLED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('NONE', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'MANUAL');

-- CreateTable
CREATE TABLE "StoreOrderCounter" (
    "storeId" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StoreOrderCounter_pkey" PRIMARY KEY ("storeId")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "state" "OrderState" NOT NULL DEFAULT 'DRAFT',
    "cashierUserId" TEXT NOT NULL,
    "shiftId" TEXT,
    "customerId" TEXT,
    "deliveryType" "DeliveryType" NOT NULL DEFAULT 'PICKUP',
    "deliveryAddress" JSONB,
    "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'NONE',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "pointsRedeemed" INTEGER NOT NULL DEFAULT 0,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod",
    "paidAmount" DECIMAL(14,2),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "unitSnapshot" "ProductUnit" NOT NULL,
    "originalUnitPrice" DECIMAL(14,2) NOT NULL,
    "taxRateSnapshot" DECIMAL(10,4) NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "discountTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(14,2) NOT NULL,
    "sourcePromotionId" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_companyId_storeId_state_createdAt_idx" ON "Order"("companyId", "storeId", "state", "createdAt");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_storeId_orderNumber_key" ON "Order"("storeId", "orderNumber");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrderCounter" ADD CONSTRAINT "StoreOrderCounter_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Дописать в конец миграции `<ts>_order/migration.sql`
-- после `pnpm --filter @shop/db exec prisma migrate dev --create-only --name order`.
--
-- Два CHECK:
--   1) Order.payment — все три поля (paymentMethod / paidAmount / paidAt) либо все NULL, либо все заполнены.
--   2) OrderItem.quantity > 0.

ALTER TABLE "Order" ADD CONSTRAINT "order_payment_coherence"
CHECK (
  ("paymentMethod" IS NULL     AND "paidAmount" IS NULL     AND "paidAt" IS NULL) OR
  ("paymentMethod" IS NOT NULL AND "paidAmount" IS NOT NULL AND "paidAt" IS NOT NULL)
);

ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_quantity_positive"
CHECK ("quantity" > 0);
