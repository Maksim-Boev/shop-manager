export type TShopOpenStatus = 'open' | 'closed' | 'unknown'

export type TWeeklySchedule = {
  days: Array<{
    day: 0 | 1 | 2 | 3 | 4 | 5 | 6
    isOpen: boolean
    from?: string
    to?: string
  }>
}

export interface IScheduleException {
  year: number | null
  month: number
  day: number
  isOpen: boolean
  from: string | null
  to: string | null
}

const parseTimeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const isWithinRange = (from: string, to: string, nowMins: number): boolean =>
  nowMins >= parseTimeToMinutes(from) && nowMins < parseTimeToMinutes(to)

const SHORT_DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

export const formatWeeklySchedule = (schedule: TWeeklySchedule | null): string | null => {
  if (!schedule) return null

  type TGroup = { startIdx: number; endIdx: number; from: string; to: string }
  const groups: TGroup[] = []
  let current: TGroup | null = null

  for (let idx = 0; idx < 7; idx++) {
    const entry = schedule.days.find(d => d.day === idx)
    const isOpen = !!entry?.isOpen && !!entry.from && !!entry.to
    if (!isOpen) {
      if (current) {
        groups.push(current)
        current = null
      }
      continue
    }
    if (current && current.from === entry!.from && current.to === entry!.to) {
      current.endIdx = idx
    } else {
      if (current) groups.push(current)
      current = { startIdx: idx, endIdx: idx, from: entry!.from!, to: entry!.to! }
    }
  }
  if (current) groups.push(current)

  if (groups.length === 0) return 'Зачинено'

  return groups
    .map(g => {
      const range =
        g.startIdx === g.endIdx
          ? SHORT_DAY_NAMES[g.startIdx]
          : `${SHORT_DAY_NAMES[g.startIdx]}–${SHORT_DAY_NAMES[g.endIdx]}`
      return `${range} ${g.from}–${g.to}`
    })
    .join(', ')
}

export const getShopOpenStatus = (
  weeklySchedule: TWeeklySchedule | null,
  exceptions: IScheduleException[],
  now: Date = new Date(),
): TShopOpenStatus => {
  if (!weeklySchedule) return 'unknown'

  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth() + 1
  const nowDay = now.getDate()
  const nowMins = now.getHours() * 60 + now.getMinutes()

  const exception =
    exceptions.find(e => e.year === nowYear && e.month === nowMonth && e.day === nowDay) ??
    exceptions.find(e => e.year === null && e.month === nowMonth && e.day === nowDay)

  if (exception) {
    if (!exception.isOpen) return 'closed'
    if (exception.from && exception.to) {
      return isWithinRange(exception.from, exception.to, nowMins) ? 'open' : 'closed'
    }
    return 'closed'
  }

  // ISO day of week: 0=Mon ... 6=Sun
  const isoDow = (now.getDay() + 6) % 7
  const dayEntry = weeklySchedule.days.find(d => d.day === isoDow)
  if (!dayEntry?.isOpen) return 'closed'
  if (dayEntry.from && dayEntry.to) {
    return isWithinRange(dayEntry.from, dayEntry.to, nowMins) ? 'open' : 'closed'
  }
  return 'closed'
}
