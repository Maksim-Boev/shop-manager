-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "costPrice" DECIMAL(14,2);

-- CHECK constraint (from migration-snippets/product-cost-check.sql)
ALTER TABLE "Product"
  ADD CONSTRAINT product_cost_price_non_negative
  CHECK ("costPrice" IS NULL OR "costPrice" >= 0);
