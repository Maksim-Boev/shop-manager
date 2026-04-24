-- Дописать в конец миграции `<ts>_return/migration.sql`
-- после `pnpm --filter @shop/db exec prisma migrate dev --create-only --name return`.
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
