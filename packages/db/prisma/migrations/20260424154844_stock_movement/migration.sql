-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('SALE', 'RETURN', 'RECEIVE', 'TRANSFER_IN', 'TRANSFER_OUT', 'INVENTORY_ADJUST', 'MANUAL_ADJUST');

-- CreateEnum
CREATE TYPE "DocState" AS ENUM ('DRAFT', 'APPLIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferState" AS ENUM ('DRAFT', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sourceStoreId" TEXT NOT NULL,
    "destinationStoreId" TEXT NOT NULL,
    "state" "TransferState" NOT NULL DEFAULT 'DRAFT',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransferItem" (
    "id" TEXT NOT NULL,
    "stockTransferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "StockTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAudit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "state" "DocState" NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "InventoryAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAuditItem" (
    "id" TEXT NOT NULL,
    "inventoryAuditId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "expectedQty" DECIMAL(14,3) NOT NULL,
    "countedQty" DECIMAL(14,3) NOT NULL,
    "delta" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "InventoryAuditItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualAdjustment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderItemId" TEXT,
    "returnItemId" TEXT,
    "goodsReceiptItemId" TEXT,
    "stockTransferItemId" TEXT,
    "inventoryAuditItemId" TEXT,
    "manualAdjustmentId" TEXT,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockTransfer_companyId_state_idx" ON "StockTransfer"("companyId", "state");

-- CreateIndex
CREATE INDEX "StockTransferItem_stockTransferId_idx" ON "StockTransferItem"("stockTransferId");

-- CreateIndex
CREATE INDEX "InventoryAudit_companyId_storeId_state_idx" ON "InventoryAudit"("companyId", "storeId", "state");

-- CreateIndex
CREATE INDEX "InventoryAuditItem_inventoryAuditId_idx" ON "InventoryAuditItem"("inventoryAuditId");

-- CreateIndex
CREATE INDEX "ManualAdjustment_companyId_storeId_idx" ON "ManualAdjustment"("companyId", "storeId");

-- CreateIndex
CREATE INDEX "StockMovement_storeId_productId_occurredAt_idx" ON "StockMovement"("storeId", "productId", "occurredAt");

-- CreateIndex
CREATE INDEX "StockMovement_companyId_occurredAt_idx" ON "StockMovement"("companyId", "occurredAt");

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_sourceStoreId_fkey" FOREIGN KEY ("sourceStoreId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_destinationStoreId_fkey" FOREIGN KEY ("destinationStoreId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_stockTransferId_fkey" FOREIGN KEY ("stockTransferId") REFERENCES "StockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAuditItem" ADD CONSTRAINT "InventoryAuditItem_inventoryAuditId_fkey" FOREIGN KEY ("inventoryAuditId") REFERENCES "InventoryAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockTransferItemId_fkey" FOREIGN KEY ("stockTransferItemId") REFERENCES "StockTransferItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inventoryAuditItemId_fkey" FOREIGN KEY ("inventoryAuditItemId") REFERENCES "InventoryAuditItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_manualAdjustmentId_fkey" FOREIGN KEY ("manualAdjustmentId") REFERENCES "ManualAdjustment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Четыре CHECK-констрейнта на StockMovement:
--   1) ровно одна source-FK non-null;
--   2) type согласован с заполненной source-FK;
--   3) quantity != 0;
--   4) знак quantity согласован с type (для типов, где он фиксирован).

-- 1) Ровно одна source-FK non-null.
ALTER TABLE "StockMovement" ADD CONSTRAINT "stock_movement_single_source"
    CHECK (
        (
            (CASE WHEN "orderItemId"          IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN "returnItemId"         IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN "goodsReceiptItemId"   IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN "stockTransferItemId"  IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN "inventoryAuditItemId" IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN "manualAdjustmentId"   IS NOT NULL THEN 1 ELSE 0 END)
            ) = 1
        );

-- 2) Согласование type ↔ source.
ALTER TABLE "StockMovement" ADD CONSTRAINT "stock_movement_type_source_match"
    CHECK (
        ("type" = 'SALE'             AND "orderItemId"          IS NOT NULL) OR
        ("type" = 'RETURN'           AND "returnItemId"         IS NOT NULL) OR
        ("type" = 'RECEIVE'          AND "goodsReceiptItemId"   IS NOT NULL) OR
        ("type" IN ('TRANSFER_IN','TRANSFER_OUT') AND "stockTransferItemId" IS NOT NULL) OR
        ("type" = 'INVENTORY_ADJUST' AND "inventoryAuditItemId" IS NOT NULL) OR
        ("type" = 'MANUAL_ADJUST'    AND "manualAdjustmentId"   IS NOT NULL)
        );

-- 3) quantity не ноль.
ALTER TABLE "StockMovement" ADD CONSTRAINT "stock_movement_quantity_nonzero"
    CHECK ("quantity" <> 0);

-- 4) Знак quantity согласован с type (для INVENTORY_ADJUST / MANUAL_ADJUST знак любой).
ALTER TABLE "StockMovement" ADD CONSTRAINT "stock_movement_quantity_sign"
    CHECK (
        ("type" IN ('SALE', 'TRANSFER_OUT') AND "quantity" < 0) OR
        ("type" IN ('RETURN', 'RECEIVE', 'TRANSFER_IN') AND "quantity" > 0) OR
        ("type" IN ('INVENTORY_ADJUST', 'MANUAL_ADJUST'))
        );
