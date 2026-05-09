'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Button, Input,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@pkg/ui'
import {
  createScheduledShift, updateScheduledShift, deleteScheduledShift,
  createScheduledShifts,
} from '@/actions/scheduled-shifts'
import type { IScheduleShiftDialogProps } from './types'
import type { IScheduledShiftRow, IStoreUserOption } from '@pkg/db'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Власник',
  ADMIN: 'Адмін',
  MANAGER: 'Менеджер',
  CASHIER: 'Касир',
  SALESPERSON: 'Продавець',
}

const pad = (n: number) => n.toString().padStart(2, '0')

const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const isoToLocalParts = (iso: string) => {
  const d = new Date(iso)
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

const buildIso = (date: string, time: string): string => {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi).toISOString()
}

interface IFormProps {
  shopId: string
  storeUsers: IStoreUserOption[]
  editing: IScheduledShiftRow | null | undefined
  defaultDateIso: string | undefined
  onClose: () => void
}

const ShiftForm = ({ shopId, storeUsers, editing, defaultDateIso, onClose }: IFormProps) => {
  const router = useRouter()

  const editStart = editing ? isoToLocalParts(editing.startsAtIso) : null
  const editEnd = editing ? isoToLocalParts(editing.endsAtIso) : null

  const [userIds, setUserIds] = useState<string[]>(editing ? [editing.userId] : [])
  const [leaderUserId, setLeaderUserId] = useState<string>(editing?.userId ?? '')
  const [isShiftLeader, setIsShiftLeader] = useState(editing?.isShiftLeader ?? false)
  const [date, setDate] = useState(editStart?.date ?? defaultDateIso ?? todayIso())
  const [startTime, setStartTime] = useState(editStart?.time ?? '09:00')
  const [endTime, setEndTime] = useState(editEnd?.time ?? '18:00')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isEditing = Boolean(editing)
  const isMulti = !isEditing && userIds.length > 1

  const toggleUser = (id: string) => {
    setUserIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      if (!next.includes(leaderUserId)) setLeaderUserId(next[0] ?? '')
      return next
    })
  }

  const submit = () => {
    if (userIds.length === 0) { setError('Оберіть співробітника'); return }
    const startsAt = buildIso(date, startTime)
    const endsAt = buildIso(date, endTime)
    if (new Date(endsAt) <= new Date(startsAt)) {
      setError('Кінець зміни має бути пізніше початку'); return
    }
    setError(null)
    startTransition(async () => {
      try {
        if (editing) {
          await updateScheduledShift({
            id: editing.id,
            userId: userIds[0],
            startsAt, endsAt,
            notes: notes.trim() || undefined,
            isShiftLeader,
          })
        } else if (userIds.length === 1) {
          await createScheduledShift({
            shopId, userId: userIds[0], startsAt, endsAt,
            notes: notes.trim() || undefined,
            isShiftLeader: true,
          })
        } else {
          await createScheduledShifts({
            shopId, userIds, startsAt, endsAt,
            notes: notes.trim() || undefined,
            leaderUserId: leaderUserId || userIds[0],
          })
        }
        onClose()
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      }
    })
  }

  const remove = () => {
    if (!editing) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteScheduledShift(editing.id)
        onClose()
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      }
    })
  }

  return (
    <>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground block mb-1">
            {isEditing ? 'Співробітник' : 'Співробітники'}
          </label>
          {isEditing ? (
            <Select
              value={userIds[0] ?? ''}
              onValueChange={v => setUserIds([v])}
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Оберіть співробітника" />
              </SelectTrigger>
              <SelectContent>
                {storeUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} — {ROLE_LABELS[u.role] ?? u.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="border border-slate-200 dark:border-border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
              {storeUsers.map(u => {
                const checked = userIds.includes(u.id)
                return (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-muted/40 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isPending}
                      onChange={() => toggleUser(u.id)}
                      className="size-4 accent-indigo-600"
                    />
                    <span className="text-slate-700 dark:text-foreground">
                      {u.firstName} {u.lastName} — {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {isMulti && (
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground block mb-1">
              Старший зміни
            </label>
            <div className="space-y-1">
              {userIds.map(uid => {
                const u = storeUsers.find(x => x.id === uid)
                if (!u) return null
                return (
                  <label
                    key={uid}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-muted/40 cursor-pointer text-sm"
                  >
                    <input
                      type="radio"
                      name="leader"
                      checked={leaderUserId === uid}
                      onChange={() => setLeaderUserId(uid)}
                      disabled={isPending}
                      className="size-4 accent-indigo-600"
                    />
                    <span className="text-slate-700 dark:text-foreground">
                      {u.firstName} {u.lastName}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {isEditing && (
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={isShiftLeader}
              onChange={e => setIsShiftLeader(e.target.checked)}
              disabled={isPending}
              className="size-4 accent-indigo-600"
            />
            <span className="text-slate-700 dark:text-foreground">Старший цієї зміни</span>
          </label>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground block mb-1">
            Дата
          </label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={isPending} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground block mb-1">
              Початок
            </label>
            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={isPending} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground block mb-1">
              Кінець
            </label>
            <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={isPending} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground block mb-1">
            Нотатки (необов&apos;язково)
          </label>
          <Input value={notes} onChange={e => setNotes(e.target.value)} disabled={isPending} maxLength={500} />
        </div>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        {editing ? (
          <Button
            variant="ghost-destructive"
            onClick={remove}
            disabled={isPending}
          >
            Видалити
          </Button>
        ) : <span />}
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Скасувати</Button>
          <Button onClick={submit} disabled={isPending || userIds.length === 0}>
            {isPending ? 'Збереження…' : editing ? 'Зберегти' : 'Додати'}
          </Button>
        </div>
      </div>
    </>
  )
}

const ScheduleShiftDialog = ({
  shopId, storeUsers, open, onOpenChange, editing, defaultDateIso,
}: IScheduleShiftDialogProps) => {
  const formKey = editing ? `edit:${editing.id}` : `new:${defaultDateIso ?? 'today'}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Редагувати зміну' : 'Додати зміну'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Зміна параметрів запланованої зміни співробітника.'
              : 'Призначити співробітника на зміну в цей магазин.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ShiftForm
            key={formKey}
            shopId={shopId}
            storeUsers={storeUsers}
            editing={editing}
            defaultDateIso={defaultDateIso}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export { ScheduleShiftDialog }
