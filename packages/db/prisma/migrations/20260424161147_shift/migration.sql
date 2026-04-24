-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ShiftReportType" AS ENUM ('X', 'Z');

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "cashierUserId" TEXT NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openingCash" DECIMAL(14,2) NOT NULL,
    "closingCash" DECIMAL(14,2),
    "expectedCash" DECIMAL(14,2),
    "variance" DECIMAL(14,2),

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftReport" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "type" "ShiftReportType" NOT NULL,
    "printedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "ShiftReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shift_companyId_cashierUserId_status_idx" ON "Shift"("companyId", "cashierUserId", "status");

-- CreateIndex
CREATE INDEX "Shift_storeId_status_idx" ON "Shift"("storeId", "status");

-- CreateIndex
CREATE INDEX "ShiftReport_shiftId_idx" ON "ShiftReport"("shiftId");

-- AddForeignKey
ALTER TABLE "ShiftReport" ADD CONSTRAINT "ShiftReport_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
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
