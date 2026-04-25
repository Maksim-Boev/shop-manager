-- Дописать в конец миграции `<ts>_salary/migration.sql`
-- после `pnpm --filter @shop/db exec prisma migrate dev --create-only --name salary`.
--
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
