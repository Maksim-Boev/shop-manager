import type { TWeeklySchedule, IStoreScheduleException } from '@pkg/db'

export interface IScheduleTabProps {
  shopId: string
  weeklySchedule: TWeeklySchedule | null
  exceptions: IStoreScheduleException[]
}
