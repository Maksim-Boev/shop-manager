-- Дописать в конец миграции `<ts>_stock_movement/migration.sql`
-- после `pnpm --filter @shop/db exec prisma migrate dev --create-only --name stock_movement`.
--
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
