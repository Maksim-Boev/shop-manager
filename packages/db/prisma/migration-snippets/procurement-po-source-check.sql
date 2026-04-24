-- Дописать в конец миграции `<ts>_procurement/migration.sql`
-- после `pnpm --filter @shop/db exec prisma migrate dev --create-only --name procurement`.
--
-- CHECK `po_source_type_match` — связка PurchaseOrder.sourceType со значениями supplierId / sourceWarehouseId:
--   SUPPLIER      → supplierId обязателен, sourceWarehouseId запрещён;
--   ANY_SUPPLIER  → оба NULL (поставщик выберется позже);
--   WAREHOUSE     → sourceWarehouseId обязателен, supplierId запрещён.

ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "po_source_type_match"
CHECK (
  ("sourceType" = 'SUPPLIER'     AND "supplierId"        IS NOT NULL AND "sourceWarehouseId" IS NULL) OR
  ("sourceType" = 'ANY_SUPPLIER' AND "supplierId"        IS NULL     AND "sourceWarehouseId" IS NULL) OR
  ("sourceType" = 'WAREHOUSE'    AND "sourceWarehouseId" IS NOT NULL AND "supplierId"        IS NULL)
);
