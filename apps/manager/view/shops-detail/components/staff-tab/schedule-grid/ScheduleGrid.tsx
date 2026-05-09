'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeftIcon, ChevronRightIcon, PlusIcon, CrownIcon,
} from 'lucide-react'
import { Button } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { ScheduleShiftDialog } from '../schedule-shift-dialog'
import type { IScheduleGridProps } from './types'
import type { IScheduledShiftRow } from '@pkg/db'

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const HOUR_START = 6
const HOUR_END = 24
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

const ACCENT_KEYS = ['indigo', 'emerald', 'amber', 'sky', 'violet', 'teal'] as const
const ACCENT_BG: Record<typeof ACCENT_KEYS[number], string> = {
  indigo: 'bg-indigo-500/85 hover:bg-indigo-500',
  emerald: 'bg-emerald-500/85 hover:bg-emerald-500',
  amber: 'bg-amber-500/85 hover:bg-amber-500',
  sky: 'bg-sky-500/85 hover:bg-sky-500',
  violet: 'bg-violet-500/85 hover:bg-violet-500',
  teal: 'bg-teal-500/85 hover:bg-teal-500',
}

const accentFor = (id: string) => {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return ACCENT_BG[ACCENT_KEYS[hash % ACCENT_KEYS.length]]
}

const pad = (n: number) => n.toString().padStart(2, '0')

const fmtDateIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const minutesFromMidnight = (d: Date) => d.getHours() * 60 + d.getMinutes()

const fmtRange = (startIso: string, endIso: string) => {
  const s = new Date(startIso)
  const e = new Date(endIso)
  return `${pad(s.getHours())}:${pad(s.getMinutes())}–${pad(e.getHours())}:${pad(e.getMinutes())}`
}

const fmtWeekTitle = (start: Date) => {
  const end = new Date(start.getTime() + 6 * 86_400_000)
  const fmt = (d: Date) => `${d.getDate()}.${pad(d.getMonth() + 1)}`
  return `${fmt(start)} – ${fmt(end)}`
}

const assignLanes = (sorted: IScheduledShiftRow[]): { row: IScheduledShiftRow; lane: number }[] => {
  const laneEnds: number[] = []
  return sorted.map(s => {
    const startM = minutesFromMidnight(new Date(s.startsAtIso))
    const endM = minutesFromMidnight(new Date(s.endsAtIso))
    let lane = laneEnds.findIndex(e => e <= startM)
    if (lane === -1) {
      laneEnds.push(endM)
      lane = laneEnds.length - 1
    } else {
      laneEnds[lane] = endM
    }
    return { row: s, lane }
  })
}

const ScheduleGrid = ({
  shopId, shifts, storeUsers, weekStartIso, canManage,
}: IScheduleGridProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const weekStart = new Date(weekStartIso)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<IScheduledShiftRow | null>(null)
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined)

  const navigateWeek = (deltaDays: number) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + deltaDays)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'staff')
    params.set('weekStart', fmtDateIso(d))
    router.push(`/shops/${shopId}?${params.toString()}`)
  }

  const goToCurrentWeek = () => {
    const today = new Date()
    const dow = today.getDay()
    const mondayOffset = dow === 0 ? -6 : 1 - dow
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'staff')
    params.set('weekStart', fmtDateIso(monday))
    router.push(`/shops/${shopId}?${params.toString()}`)
  }

  const openCreateFor = (date: Date) => {
    if (!canManage) return
    setEditing(null)
    setDefaultDate(fmtDateIso(date))
    setDialogOpen(true)
  }
  const openEdit = (row: IScheduledShiftRow) => {
    if (!canManage) return
    setEditing(row)
    setDefaultDate(undefined)
    setDialogOpen(true)
  }

  const shiftsByDay: Record<string, IScheduledShiftRow[]> = {}
  for (const d of days) shiftsByDay[fmtDateIso(d)] = []
  for (const s of shifts) {
    const key = fmtDateIso(new Date(s.startsAtIso))
    if (shiftsByDay[key]) shiftsByDay[key].push(s)
  }

  const totalMinutes = (HOUR_END - HOUR_START) * 60

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-border gap-3">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-foreground">Графік змін</h2>
          <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
            Тиждень {fmtWeekTitle(weekStart)} · {shifts.length}{' '}
            {shifts.length === 1 ? 'зміна' : 'змін'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => navigateWeek(-7)} aria-label="Попередній тиждень">
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
            Цей тиждень
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigateWeek(7)} aria-label="Наступний тиждень">
            <ChevronRightIcon className="size-4" />
          </Button>
          {canManage && (
            <Button size="sm" onClick={() => openCreateFor(days[0])} className="ml-2 gap-1">
              <PlusIcon className="size-3.5" /> Зміна
            </Button>
          )}
        </div>
      </div>

      <div className="p-5 overflow-x-auto">
        <div className="min-w-[820px]">
          {/* Hour ruler */}
          <div className="flex">
            <div className="w-28 shrink-0" />
            <div
              className="flex-1 grid"
              style={{ gridTemplateColumns: `repeat(${HOURS.length}, 1fr)` }}
            >
              {HOURS.map(h => (
                <div
                  key={h}
                  className="text-[10px] text-slate-400 dark:text-muted-foreground text-center tabular-nums"
                >
                  {pad(h)}
                </div>
              ))}
            </div>
          </div>

          {/* Day rows */}
          <div className="mt-2 space-y-1.5">
            {days.map((day, idx) => {
              const key = fmtDateIso(day)
              const dayShifts = shiftsByDay[key]
              const isToday = fmtDateIso(new Date()) === key

              const sorted = [...dayShifts].sort((a, b) =>
                new Date(a.startsAtIso).getTime() - new Date(b.startsAtIso).getTime()
              )
              const laned = assignLanes(sorted)
              const laneCount = Math.max(1, ...laned.map(l => l.lane + 1))
              const rowHeight = laneCount * 36

              return (
                <div key={key} className="flex items-stretch group">
                  <div className="w-28 shrink-0 flex items-baseline gap-1.5 pr-3 pt-2">
                    <span
                      className={cn(
                        'text-xs font-bold uppercase',
                        isToday
                          ? 'text-indigo-600 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-foreground/90',
                      )}
                    >
                      {DAY_LABELS[idx]}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-muted-foreground tabular-nums">
                      {day.getDate()}.{pad(day.getMonth() + 1)}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'relative flex-1 rounded-md',
                      isToday ? 'bg-indigo-50/60 dark:bg-indigo-500/5' : 'bg-slate-50 dark:bg-muted/30',
                      canManage && 'cursor-pointer',
                    )}
                    style={{ height: `${rowHeight}px` }}
                    onClick={e => {
                      if (e.target === e.currentTarget) openCreateFor(day)
                    }}
                  >
                    <div
                      className="absolute inset-0 grid pointer-events-none"
                      style={{ gridTemplateColumns: `repeat(${HOURS.length}, 1fr)` }}
                    >
                      {HOURS.map((h, i) => (
                        <div
                          key={h}
                          className={cn(
                            'border-l border-slate-200/70 dark:border-border/50',
                            i === 0 && 'border-l-0',
                          )}
                        />
                      ))}
                    </div>

                    {laned.map(({ row: s, lane }) => {
                      const startM = minutesFromMidnight(new Date(s.startsAtIso))
                      const endM = minutesFromMidnight(new Date(s.endsAtIso))
                      const left = ((startM - HOUR_START * 60) / totalMinutes) * 100
                      const width = ((endM - startM) / totalMinutes) * 100
                      if (width <= 0) return null

                      return (
                        <button
                          key={s.id}
                          onClick={e => { e.stopPropagation(); openEdit(s) }}
                          className={cn(
                            'absolute rounded text-[11px] font-semibold text-white px-2 flex items-center gap-1.5 truncate text-left transition-colors shadow-sm',
                            accentFor(s.userId),
                          )}
                          style={{
                            top: `${lane * 36 + 4}px`,
                            height: `28px`,
                            left: `clamp(0%, ${left}%, 100%)`,
                            width: `min(${width}%, ${100 - Math.max(left, 0)}%)`,
                          }}
                          title={`${s.firstName} ${s.lastName} · ${fmtRange(s.startsAtIso, s.endsAtIso)}${s.isShiftLeader ? ' · старший' : ''}${s.notes ? ` · ${s.notes}` : ''}`}
                        >
                          {s.isShiftLeader && (
                            <CrownIcon className="size-3 shrink-0 text-amber-200" />
                          )}
                          <span className="w-5 h-5 rounded-full bg-white/25 text-[9px] flex items-center justify-center shrink-0">
                            {s.firstName[0]}{s.lastName[0]}
                          </span>
                          <span className="truncate">
                            {s.firstName} · {fmtRange(s.startsAtIso, s.endsAtIso)}
                          </span>
                        </button>
                      )
                    })}

                    {dayShifts.length === 0 && canManage && (
                      <button
                        onClick={() => openCreateFor(day)}
                        className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400 dark:text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        + додати зміну
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <ScheduleShiftDialog
        shopId={shopId}
        storeUsers={storeUsers}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        defaultDateIso={defaultDate}
      />
    </div>
  )
}

export { ScheduleGrid }
