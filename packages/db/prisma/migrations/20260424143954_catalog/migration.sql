-- This is an empty migration.

-- SKU уникален в рамках компании среди неархивных товаров.
CREATE UNIQUE INDEX "Product_company_sku_active_key"
    ON "Product" ("companyId", "sku")
    WHERE "status" <> 'ARCHIVED';

-- Штрихкод уникален среди активных ProductBarcode.
CREATE UNIQUE INDEX "ProductBarcode_barcode_active_key"
    ON "ProductBarcode" ("barcode")
    WHERE "isActive" = true;
