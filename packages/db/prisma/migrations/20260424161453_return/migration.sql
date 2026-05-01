-- CreateEnum
CREATE TYPE "ReturnState" AS ENUM ('DRAFT', 'APPLIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnReasonCode" AS ENUM ('BRAK', 'NOT_FIT', 'REFUSAL', 'OTHER');

-- CreateTable
CREATE TABLE "Return" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "state" "ReturnState" NOT NULL DEFAULT 'DRAFT',
    "reasonCode" "ReturnReasonCode" NOT NULL,
    "reasonNotes" TEXT,
    "refundMethod" "PaymentMethod" NOT NULL,
    "refundAmount" DECIMAL(14,2) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unitRefundAmount" DECIMAL(14,2) NOT NULL,
    "refundSubtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Return_companyId_storeId_state_idx" ON "Return"("companyId", "storeId", "state");

-- CreateIndex
CREATE INDEX "Return_orderId_idx" ON "Return"("orderId");

-- CreateIndex
CREATE INDEX "ReturnItem_returnId_idx" ON "ReturnItem"("returnId");

-- CreateIndex
CREATE INDEX "ReturnItem_orderItemId_idx" ON "ReturnItem"("orderItemId");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_returnItemId_fkey" FOREIGN KEY ("returnItemId") REFERENCES "ReturnItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "Return"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Дописать в конец миграции `<ts>_return/migration.sql`
-- после `pnpm --filter @pkg/db exec prisma migrate dev --create-only --name return`.
--
-- Три CHECK:
--   1) appliedAt обязателен только при state=APPLIED, запрещён иначе.
--   2) refundAmount >= 0.
--   3) ReturnItem.quantity > 0.

ALTER TABLE "Return" ADD CONSTRAINT "return_applied_at_match"
CHECK (
  ("state"  = 'APPLIED' AND "appliedAt" IS NOT NULL) OR
  ("state" <> 'APPLIED' AND "appliedAt" IS NULL)
);

ALTER TABLE "Return" ADD CONSTRAINT "return_refund_nonneg"
CHECK ("refundAmount" >= 0);

ALTER TABLE "ReturnItem" ADD CONSTRAINT "return_item_quantity_positive"
CHECK ("quantity" > 0);
