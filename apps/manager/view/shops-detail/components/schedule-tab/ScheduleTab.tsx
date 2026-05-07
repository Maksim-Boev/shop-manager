import { WeeklySchedule } from './components/weekly-schedule'
import { ExceptionsList } from './components/exceptions-list'
import type { IScheduleTabProps } from './types'

const ScheduleTab = ({ shopId, weeklySchedule, exceptions }: IScheduleTabProps) => (
  <div className="space-y-8">
    <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6">
      <div className="mb-5">
        <h2 className="font-bold text-slate-900 dark:text-foreground">Основний тижневий графік</h2>
        <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
          Стандартний розклад роботи магазину щотижня
        </p>
      </div>
      <WeeklySchedule shopId={shopId} initialSchedule={weeklySchedule} />
    </div>

    <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6">
      <ExceptionsList shopId={shopId} exceptions={exceptions} />
    </div>
  </div>
)

export { ScheduleTab }
