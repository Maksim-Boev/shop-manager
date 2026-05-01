-- Дописать в конец миграции `<ts>_store_product_and_price_history/migration.sql`
-- после `pnpm --filter @pkg/db exec prisma migrate dev --create-only --name store_product_and_price_history`.
--
-- Три триггера:
--   1) Пишет PriceHistory при UPDATE Product.basePrice.
--   2) Пишет PriceHistory при UPDATE StoreProduct.priceOverride.
--   3) Синхронизирует ProductBarcode.isActive при смене Product.status.
--
-- Автор изменения берётся из session variable `app.user_id` (выставляется в приложении
-- через `SET LOCAL app.user_id = ...` в транзакции). Если не выставлен — NULL.

-- 1) PriceHistory при изменении Product.basePrice
CREATE OR REPLACE FUNCTION log_product_base_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."basePrice" IS DISTINCT FROM OLD."basePrice" THEN
    INSERT INTO "PriceHistory" (
      "id", "companyId", "productId", "storeId",
      "oldPrice", "newPrice", "changedByUserId", "changedAt"
    ) VALUES (
      gen_random_uuid()::text,
      NEW."companyId", NEW."id", NULL,
      OLD."basePrice", NEW."basePrice",
      current_setting('app.user_id', true),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_base_price_history
AFTER UPDATE OF "basePrice" ON "Product"
FOR EACH ROW EXECUTE FUNCTION log_product_base_price_change();

-- 2) PriceHistory при изменении StoreProduct.priceOverride
CREATE OR REPLACE FUNCTION log_store_product_price_change()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id text;
BEGIN
  IF NEW."priceOverride" IS DISTINCT FROM OLD."priceOverride" THEN
    SELECT p."companyId" INTO v_company_id
    FROM "Product" p WHERE p."id" = NEW."productId";

    INSERT INTO "PriceHistory" (
      "id", "companyId", "productId", "storeId",
      "oldPrice", "newPrice", "changedByUserId", "changedAt"
    ) VALUES (
      gen_random_uuid()::text,
      v_company_id, NEW."productId", NEW."storeId",
      COALESCE(OLD."priceOverride", 0),
      COALESCE(NEW."priceOverride", 0),
      current_setting('app.user_id', true),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_store_product_price_history
AFTER UPDATE OF "priceOverride" ON "StoreProduct"
FOR EACH ROW EXECUTE FUNCTION log_store_product_price_change();

-- 3) Синхронизация ProductBarcode.isActive с Product.status
CREATE OR REPLACE FUNCTION sync_product_barcode_is_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."status" IS DISTINCT FROM OLD."status" THEN
    IF NEW."status" = 'ARCHIVED' THEN
      UPDATE "ProductBarcode" SET "isActive" = false WHERE "productId" = NEW."id";
    ELSIF NEW."status" = 'ACTIVE' THEN
      UPDATE "ProductBarcode" SET "isActive" = true WHERE "productId" = NEW."id";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_barcode_sync
AFTER UPDATE OF "status" ON "Product"
FOR EACH ROW EXECUTE FUNCTION sync_product_barcode_is_active();
