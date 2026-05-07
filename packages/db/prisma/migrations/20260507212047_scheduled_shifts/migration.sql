-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "scheduledShiftId" TEXT;

-- CreateTable
CREATE TABLE "ScheduledShift" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledShift_companyId_storeId_startsAt_idx" ON "ScheduledShift"("companyId", "storeId", "startsAt");

-- CreateIndex
CREATE INDEX "ScheduledShift_companyId_userId_startsAt_idx" ON "ScheduledShift"("companyId", "userId", "startsAt");

-- CreateIndex
CREATE INDEX "Shift_scheduledShiftId_idx" ON "Shift"("scheduledShiftId");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_scheduledShiftId_fkey" FOREIGN KEY ("scheduledShiftId") REFERENCES "ScheduledShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledShift" ADD CONSTRAINT "ScheduledShift_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledShift" ADD CONSTRAINT "ScheduledShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CheckConstraints (from migration-snippets/scheduled-shift-checks.sql)
ALTER TABLE "ScheduledShift"
  ADD CONSTRAINT "scheduled_shift_time_order"
    CHECK ("endsAt" > "startsAt"),
  ADD CONSTRAINT "scheduled_shift_max_duration"
    CHECK ("endsAt" - "startsAt" <= INTERVAL '24 hours');
