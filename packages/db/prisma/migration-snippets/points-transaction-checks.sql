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
