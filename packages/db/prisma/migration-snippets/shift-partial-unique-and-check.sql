-- Дописать в конец миграции `<ts>_shift/migration.sql`
-- после `pnpm --filter @shop/db exec prisma migrate dev --create-only --name shift`.
--
--   1) Partial unique: у одного кассира не более одной OPEN-смены в компании.
--   2) CHECK: поля закрытия (closedAt / closingCash / expectedCash / variance) когерентны со status.

CREATE UNIQUE INDEX "Shift_company_cashier_open_key"
  ON "Shift" ("companyId", "cashierUserId")
  WHERE "status" = 'OPEN';

ALTER TABLE "Shift" ADD CONSTRAINT "shift_closed_fields"
CHECK (
  ("status" = 'OPEN'   AND "closedAt" IS NULL     AND "closingCash" IS NULL AND "expectedCash" IS NULL AND "variance" IS NULL) OR
  ("status" = 'CLOSED' AND "closedAt" IS NOT NULL)
);
