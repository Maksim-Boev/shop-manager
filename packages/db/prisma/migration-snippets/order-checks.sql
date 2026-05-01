-- Дописать в конец миграции `<ts>_order/migration.sql`
-- после `pnpm --filter @pkg/db exec prisma migrate dev --create-only --name order`.
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
