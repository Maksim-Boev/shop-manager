-- CreateEnum
CREATE TYPE "DiscountSourceType" AS ENUM ('PROMOTION', 'TIER', 'CUSTOMER_RULE', 'POINTS');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PromotionActionType" AS ENUM ('PERCENT', 'FIXED_AMOUNT', 'FIXED_PRICE', 'BOGO');

-- CreateEnum
CREATE TYPE "PromotionTargetType" AS ENUM ('ALL', 'PRODUCT', 'CATEGORY', 'SUBCATEGORY', 'TAG');

-- CreateTable
CREATE TABLE "OrderItemDiscount" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "sourceType" "DiscountSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "appliedPercent" DECIMAL(10,4),
    "appliedAmount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "OrderItemDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "dayOfWeekMask" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "timeOfDayFrom" TEXT,
    "timeOfDayTo" TEXT,
    "cartMinSubtotal" DECIMAL(14,2),
    "cartMinQuantity" INTEGER,
    "minApplicableTierLevel" INTEGER,
    "requiresCustomer" BOOLEAN NOT NULL DEFAULT false,
    "actionType" "PromotionActionType" NOT NULL,
    "actionValue" DECIMAL(14,4) NOT NULL,
    "bogoTriggerQty" INTEGER,
    "bogoGetQty" INTEGER,
    "bogoGetDiscountPercent" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionTarget" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "targetType" "PromotionTargetType" NOT NULL,
    "targetId" TEXT,

    CONSTRAINT "PromotionTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionStore" (
    "promotionId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "PromotionStore_pkey" PRIMARY KEY ("promotionId","storeId")
);

-- CreateIndex
CREATE INDEX "OrderItemDiscount_orderItemId_idx" ON "OrderItemDiscount"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderItemDiscount_sourceType_sourceId_idx" ON "OrderItemDiscount"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "Promotion_companyId_status_validFrom_validTo_priority_idx" ON "Promotion"("companyId", "status", "validFrom", "validTo", "priority");

-- CreateIndex
CREATE INDEX "PromotionTarget_promotionId_idx" ON "PromotionTarget"("promotionId");

-- CreateIndex
CREATE INDEX "PromotionTarget_targetType_targetId_idx" ON "PromotionTarget"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "PromotionStore_storeId_idx" ON "PromotionStore"("storeId");

-- AddForeignKey
ALTER TABLE "OrderItemDiscount" ADD CONSTRAINT "OrderItemDiscount_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionTarget" ADD CONSTRAINT "PromotionTarget_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionStore" ADD CONSTRAINT "PromotionStore_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionStore" ADD CONSTRAINT "PromotionStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
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
