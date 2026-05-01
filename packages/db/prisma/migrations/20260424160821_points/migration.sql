-- CreateEnum
CREATE TYPE "PointsTransactionType" AS ENUM ('EARN', 'SPEND', 'EXPIRE', 'MANUAL', 'REFUND_EARN_REVERSAL', 'REFUND_SPEND_REVERSAL');

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "returnId" TEXT,
    "type" "PointsTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointsTransaction_customerId_occurredAt_idx" ON "PointsTransaction"("customerId", "occurredAt");

-- CreateIndex
CREATE INDEX "PointsTransaction_customerId_type_expiresAt_idx" ON "PointsTransaction"("customerId", "type", "expiresAt");

-- CreateIndex
CREATE INDEX "PointsTransaction_returnId_idx" ON "PointsTransaction"("returnId");

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Дописать в конец миграции `<ts>_points/migration.sql`
-- после `pnpm --filter @pkg/db exec prisma migrate dev --create-only --name points`.
--
-- Два CHECK:
--   1) expiresAt допустим только у type=EARN (сгорает только начисленное).
--   2) Знак amount согласован с type (для MANUAL знак любой).

ALTER TABLE "PointsTransaction" ADD CONSTRAINT "points_expires_only_earn"
CHECK ("expiresAt" IS NULL OR "type" = 'EARN');

ALTER TABLE "PointsTransaction" ADD CONSTRAINT "points_amount_sign"
CHECK (
  ("type" = 'EARN'                  AND "amount" > 0) OR
  ("type" = 'SPEND'                 AND "amount" < 0) OR
  ("type" = 'EXPIRE'                AND "amount" < 0) OR
  ("type" = 'MANUAL') OR
  ("type" = 'REFUND_SPEND_REVERSAL' AND "amount" > 0) OR
  ("type" = 'REFUND_EARN_REVERSAL'  AND "amount" < 0)
);
