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
} from '@/actions/scheduled-shifts'
import type { IScheduleShiftDialogProps } from './types'
import type { IScheduledShiftRow, IStoreUserOption } from '@pkg/db'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Власник',
  ADMIN: 'Адмін',
  MANAGER: 'Менеджер',
  CASHIER: 'Касир',
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

  const [userId, setUserId] = useState(editing?.userId ?? '')
  const [date, setDate] = useState(editStart?.date ?? defaultDateIso ?? todayIso())
  const [startTime, setStartTime] = useState(editStart?.time ?? '09:00')
  const [endTime, setEndTime] = useState(editEnd?.time ?? '18:00')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submit = () => {
    if (!userId) { setError('Оберіть співробітника'); return }
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
            id: editing.id, userId, startsAt, endsAt,
            notes: notes.trim() || undefined,
          })
        } else {
          await createScheduledShift({
            shopId, userId, startsAt, endsAt,
            notes: notes.trim() || undefined,
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
            Співробітник
          </label>
          <Select value={userId} onValueChange={setUserId} disabled={isPending}>
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
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground block mb-1">
            Дата
          </label>
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground block mb-1">
              Початок
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground block mb-1">
              Кінець
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground block mb-1">
            Нотатки (необов&apos;язково)
          </label>
          <Input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            disabled={isPending}
            maxLength={500}
          />
        </div>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        {editing ? (
          <Button
            variant="ghost"
            onClick={remove}
            disabled={isPending}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10"
          >
            Видалити
          </Button>
        ) : <span />}
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Скасувати
          </Button>
          <Button onClick={submit} disabled={isPending || !userId}>
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
