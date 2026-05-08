ALTER TABLE "Product"
  ADD CONSTRAINT product_cost_price_non_negative
  CHECK ("costPrice" IS NULL OR "costPrice" >= 0);
