ALTER TABLE "StoreScheduleException"
  ADD CONSTRAINT "StoreScheduleException_month_check" CHECK (month >= 1 AND month <= 12),
  ADD CONSTRAINT "StoreScheduleException_day_check" CHECK (day >= 1 AND day <= 31),
  ADD CONSTRAINT "StoreScheduleException_time_check" CHECK (
    (NOT "isOpen") OR ("from" IS NOT NULL AND "to" IS NOT NULL)
  );
