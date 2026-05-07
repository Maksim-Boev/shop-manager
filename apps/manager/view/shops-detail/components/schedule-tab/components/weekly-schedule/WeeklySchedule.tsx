'use client'

import { useState, useTransition } from 'react'
import { Button, Input } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { updateWeeklySchedule } from '@/actions/schedule'
import type { IWeeklyScheduleProps, TDayEntry } from './types'

const DAY_NAMES = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя']

const makeDefaultDays = (): TDayEntry[] =>
  ([0, 1, 2, 3, 4, 5, 6] as const).map(day => ({
    day,
    isOpen: day < 5,
    from: '09:00',
    to: '21:00',
  }))

const WeeklySchedule = ({ shopId, initialSchedule }: IWeeklyScheduleProps) => {
  const [days, setDays] = useState<TDayEntry[]>(
    initialSchedule?.days.slice().sort((a, b) => a.day - b.day) ?? makeDefaultDays(),
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const toggleDay = (index: number) => {
    setDays(prev => prev.map((d, i) => (i === index ? { ...d, isOpen: !d.isOpen } : d)))
    setSaved(false)
  }

  const setTime = (index: number, field: 'from' | 'to', value: string) => {
    setDays(prev => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)))
    setSaved(false)
  }

  const handleSave = () => {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        await updateWeeklySchedule(shopId, { days })
        setSaved(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Помилка збереження')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100 dark:divide-border">
            {days.map((entry, i) => (
              <tr key={entry.day} className={cn(!entry.isOpen && 'opacity-60')}>
                <td className="py-3 pr-4 w-10">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={entry.isOpen}
                    onClick={() => toggleDay(i)}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0',
                      entry.isOpen ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                        entry.isOpen ? 'translate-x-4' : 'translate-x-0.5',
                      )}
                    />
                  </button>
                </td>
                <td className="py-3 pr-6 w-36 font-medium text-slate-900 dark:text-foreground">
                  {DAY_NAMES[i]}
                </td>
                <td className="py-3">
                  {entry.isOpen ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={entry.from ?? ''}
                        onChange={e => setTime(i, 'from', e.target.value)}
                        className="w-28"
                        disabled={isPending}
                      />
                      <span className="text-slate-400 dark:text-muted-foreground">—</span>
                      <Input
                        type="time"
                        value={entry.to ?? ''}
                        onChange={e => setTime(i, 'to', e.target.value)}
                        className="w-28"
                        disabled={isPending}
                      />
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-muted-foreground text-xs italic">
                      Вихідний
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {saved && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Графік збережено</p>
      )}

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? 'Збереження…' : 'Зберегти графік'}
      </Button>
    </div>
  )
}

export { WeeklySchedule }
