-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SALESPERSON';

-- AlterTable
ALTER TABLE "ScheduledShift" ADD COLUMN     "isShiftLeader" BOOLEAN NOT NULL DEFAULT false;
