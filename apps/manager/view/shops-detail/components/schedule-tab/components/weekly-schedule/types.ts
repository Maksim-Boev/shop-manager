import type { TWeeklySchedule } from '@pkg/db'

export type TDayEntry = TWeeklySchedule['days'][number]

export interface IWeeklyScheduleProps {
  shopId: string
  initialSchedule: TWeeklySchedule | null
}
