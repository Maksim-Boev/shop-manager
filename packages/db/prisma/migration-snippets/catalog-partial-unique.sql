-- Дописать в конец миграции `<ts>_catalog/migration.sql` после `pnpm --filter @pkg/db exec prisma migrate dev --create-only --name catalog`.
-- Эти partial unique indexes нельзя выразить в schema.prisma и ставятся raw SQL.

-- SKU уникален в рамках компании среди неархивных товаров.
CREATE UNIQUE INDEX "Product_company_sku_active_key"
  ON "Product" ("companyId", "sku")
  WHERE "status" <> 'ARCHIVED';

-- Штрихкод уникален среди активных ProductBarcode.
CREATE UNIQUE INDEX "ProductBarcode_barcode_active_key"
  ON "ProductBarcode" ("barcode")
  WHERE "isActive" = true;
