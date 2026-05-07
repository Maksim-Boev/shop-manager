-- ScheduledShift: integrity checks
-- Дописать в конец сгенерированной migration.sql после prisma migrate dev --create-only.

ALTER TABLE "ScheduledShift"
  ADD CONSTRAINT "scheduled_shift_time_order"
    CHECK ("endsAt" > "startsAt"),
  ADD CONSTRAINT "scheduled_shift_max_duration"
    CHECK ("endsAt" - "startsAt" <= INTERVAL '24 hours');
