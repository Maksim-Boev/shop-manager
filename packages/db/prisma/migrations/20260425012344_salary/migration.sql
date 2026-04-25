-- CreateEnum
CREATE TYPE "SalaryRatePeriod" AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "SalaryPayoutStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "UserSalaryRate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ratePeriod" "SalaryRatePeriod" NOT NULL,
    "rateAmount" DECIMAL(14,2) NOT NULL,
    "salesPercent" DECIMAL(10,4) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSalaryRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryPayout" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "status" "SalaryPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod",
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSalaryRate_userId_effectiveFrom_idx" ON "UserSalaryRate"("userId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "UserSalaryRate_companyId_effectiveFrom_idx" ON "UserSalaryRate"("companyId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "SalaryPayout_companyId_periodYear_periodMonth_idx" ON "SalaryPayout"("companyId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "SalaryPayout_status_idx" ON "SalaryPayout"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryPayout_userId_periodYear_periodMonth_key" ON "SalaryPayout"("userId", "periodYear", "periodMonth");

-- AddForeignKey
ALTER TABLE "UserSalaryRate" ADD CONSTRAINT "UserSalaryRate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayout" ADD CONSTRAINT "SalaryPayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

--   1) UserSalaryRate: rateAmount/salesPercent неотрицательны.
--   2) UserSalaryRate: интервал effectiveFrom..effectiveTo валиден.
--   3) UserSalaryRate: у одного сотрудника не более одной активной ставки (effectiveTo IS NULL).
--   4) SalaryPayout: периоды в разумных границах.
--   5) SalaryPayout: totalAmount неотрицателен.
--   6) SalaryPayout: статус PAID когерентен с paidAt + paymentMethod.
--   7) SalaryPayout: статус CANCELLED исключает paidAt.

ALTER TABLE "UserSalaryRate" ADD CONSTRAINT "user_salary_rate_nonneg"
    CHECK ("rateAmount" >= 0 AND "salesPercent" >= 0);

ALTER TABLE "UserSalaryRate" ADD CONSTRAINT "user_salary_rate_valid_range"
    CHECK ("effectiveTo" IS NULL OR "effectiveTo" > "effectiveFrom");

CREATE UNIQUE INDEX "UserSalaryRate_user_active_key"
    ON "UserSalaryRate" ("userId")
    WHERE "effectiveTo" IS NULL;

ALTER TABLE "SalaryPayout" ADD CONSTRAINT "salary_payout_period_range"
    CHECK (
        "periodMonth" BETWEEN 1 AND 12
            AND "periodYear" BETWEEN 2000 AND 3000
        );

ALTER TABLE "SalaryPayout" ADD CONSTRAINT "salary_payout_amount_nonneg"
    CHECK ("totalAmount" >= 0);

ALTER TABLE "SalaryPayout" ADD CONSTRAINT "salary_payout_paid_coherence"
    CHECK (
        ("status" = 'PAID') = ("paidAt" IS NOT NULL AND "paymentMethod" IS NOT NULL)
        );

ALTER TABLE "SalaryPayout" ADD CONSTRAINT "salary_payout_cancelled_unpaid"
    CHECK ("status" <> 'CANCELLED' OR "paidAt" IS NULL);
