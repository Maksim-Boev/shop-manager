-- Дописать в конец миграции `<ts>_promotion/migration.sql`
-- после `pnpm --filter @shop/db exec prisma migrate dev --create-only --name promotion`.
--
-- Три CHECK-констрейнта:
--   1) BOGO-поля когерентны с actionType=BOGO.
--   2) PromotionTarget.targetId согласован с targetType (NULL только для ALL).
--   3) Promotion.validFrom < validTo.

ALTER TABLE "Promotion" ADD CONSTRAINT "promotion_bogo_coherence"
CHECK (
  ("actionType"  = 'BOGO' AND "bogoTriggerQty" IS NOT NULL AND "bogoGetQty" IS NOT NULL AND "bogoGetDiscountPercent" IS NOT NULL) OR
  ("actionType" <> 'BOGO' AND "bogoTriggerQty" IS NULL     AND "bogoGetQty" IS NULL     AND "bogoGetDiscountPercent" IS NULL)
);

ALTER TABLE "PromotionTarget" ADD CONSTRAINT "promotion_target_id_match"
CHECK (
  ("targetType"  = 'ALL' AND "targetId" IS NULL) OR
  ("targetType" <> 'ALL' AND "targetId" IS NOT NULL)
);

ALTER TABLE "Promotion" ADD CONSTRAINT "promotion_valid_range"
CHECK ("validFrom" < "validTo");
