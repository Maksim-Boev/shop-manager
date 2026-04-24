-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CustomerContactType" AS ENUM ('PHONE', 'LOYALTY_CARD');

-- CreateEnum
CREATE TYPE "DiscountRuleScope" AS ENUM ('WHOLE_ORDER', 'CATEGORY', 'SUBCATEGORY', 'TAG', 'PRODUCT');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "birthday" TIMESTAMP(3),
    "tierId" TEXT,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "lastPurchaseAt" TIMESTAMP(3),
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerContact" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "CustomerContactType" NOT NULL,
    "value" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CustomerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tier" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "entryThreshold" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "Tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierRule" (
    "id" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "scope" "DiscountRuleScope" NOT NULL,
    "targetId" TEXT,
    "discountPercent" DECIMAL(10,4),
    "discountAmount" DECIMAL(14,2),

    CONSTRAINT "TierRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerDiscountRule" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "scope" "DiscountRuleScope" NOT NULL,
    "targetId" TEXT,
    "discountPercent" DECIMAL(10,4),
    "discountAmount" DECIMAL(14,2),
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),

    CONSTRAINT "CustomerDiscountRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_companyId_status_idx" ON "Customer"("companyId", "status");

-- CreateIndex
CREATE INDEX "Customer_companyId_lastPurchaseAt_idx" ON "Customer"("companyId", "lastPurchaseAt");

-- CreateIndex
CREATE INDEX "CustomerContact_customerId_idx" ON "CustomerContact"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerContact_companyId_type_value_key" ON "CustomerContact"("companyId", "type", "value");

-- CreateIndex
CREATE INDEX "Tier_companyId_idx" ON "Tier"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Tier_companyId_level_key" ON "Tier"("companyId", "level");

-- CreateIndex
CREATE INDEX "TierRule_tierId_idx" ON "TierRule"("tierId");

-- CreateIndex
CREATE INDEX "CustomerDiscountRule_customerId_idx" ON "CustomerDiscountRule"("customerId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierRule" ADD CONSTRAINT "TierRule_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerDiscountRule" ADD CONSTRAINT "CustomerDiscountRule_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
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
