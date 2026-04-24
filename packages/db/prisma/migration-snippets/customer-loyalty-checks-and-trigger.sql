-- Дописать в конец миграции `<ts>_customer_loyalty/migration.sql`
-- после `pnpm --filter @shop/db exec prisma migrate dev --create-only --name customer_loyalty`.
--
-- Четыре CHECK + один триггер:
--   1) TierRule: ровно одно из discountPercent / discountAmount заполнено.
--   2) TierRule: scope=WHOLE_ORDER ↔ targetId IS NULL.
--   3-4) То же для CustomerDiscountRule.
--   5) Триггер BEFORE INSERT на CustomerContact — подтягивает companyId из Customer,
--      если он не передан (страховка для raw-SQL вставок; Prisma-слой требует companyId явно).

ALTER TABLE "TierRule" ADD CONSTRAINT "tier_rule_one_discount"
CHECK (
  ("discountPercent" IS NOT NULL)::int + ("discountAmount" IS NOT NULL)::int = 1
);

ALTER TABLE "TierRule" ADD CONSTRAINT "tier_rule_target_match"
CHECK (
  ("scope"  = 'WHOLE_ORDER' AND "targetId" IS NULL) OR
  ("scope" <> 'WHOLE_ORDER' AND "targetId" IS NOT NULL)
);

ALTER TABLE "CustomerDiscountRule" ADD CONSTRAINT "customer_rule_one_discount"
CHECK (
  ("discountPercent" IS NOT NULL)::int + ("discountAmount" IS NOT NULL)::int = 1
);

ALTER TABLE "CustomerDiscountRule" ADD CONSTRAINT "customer_rule_target_match"
CHECK (
  ("scope"  = 'WHOLE_ORDER' AND "targetId" IS NULL) OR
  ("scope" <> 'WHOLE_ORDER' AND "targetId" IS NOT NULL)
);

CREATE OR REPLACE FUNCTION fill_customer_contact_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."companyId" IS NULL THEN
    SELECT c."companyId" INTO NEW."companyId"
    FROM "Customer" c WHERE c."id" = NEW."customerId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customer_contact_fill_company_id
BEFORE INSERT ON "CustomerContact"
FOR EACH ROW EXECUTE FUNCTION fill_customer_contact_company_id();
