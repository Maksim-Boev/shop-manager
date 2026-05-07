'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Button, Input,
} from '@pkg/ui'
import { addScheduleException, updateScheduleException } from '@/actions/schedule'
import type { IExceptionModalProps } from './types'

const pad = (n: number) => n.toString().padStart(2, '0')

const ExceptionModal = ({ open, onOpenChange, shopId, editingException }: IExceptionModalProps) => {
  const [isPending, startTransition] = useTransition()
  const [date, setDate] = useState('')
  const [annual, setAnnual] = useState(false)
  const [mode, setMode] = useState<'closed' | 'short'>('closed')
  const [from, setFrom] = useState('09:00')
  const [to, setTo] = useState('18:00')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (editingException) {
      const year = editingException.year ?? new Date().getFullYear()
      setDate(`${year}-${pad(editingException.month)}-${pad(editingException.day)}`)
      setAnnual(editingException.year === null)
      setMode(editingException.isOpen ? 'short' : 'closed')
      setFrom(editingException.from ?? '09:00')
      setTo(editingException.to ?? '18:00')
      setNote(editingException.note ?? '')
    } else {
      setDate('')
      setAnnual(false)
      setMode('closed')
      setFrom('09:00')
      setTo('18:00')
      setNote('')
    }
    setError(null)
  }, [editingException, open])

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      try {
        const payload = {
          date,
          annual,
          isOpen: mode === 'short',
          ...(mode === 'short' && { from, to }),
          ...(note.trim() && { note: note.trim() }),
        }
        if (editingException) {
          await updateScheduleException(editingException.id, shopId, payload)
        } else {
          await addScheduleException(shopId, payload)
        }
        onOpenChange(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Помилка')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingException ? 'Редагувати виключення' : 'Нове виключення'}
          </DialogTitle>
          <DialogDescription>
            Вкажіть дату та режим роботи магазину для цього виключення.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-muted-foreground tracking-wide">
              Дата <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="exc-annual"
              checked={annual}
              onChange={e => setAnnual(e.target.checked)}
              disabled={isPending}
              className="w-4 h-4 accent-indigo-600"
            />
            <label
              htmlFor="exc-annual"
              className="text-sm text-slate-700 dark:text-foreground cursor-pointer"
            >
              Щорічне виключення
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-muted-foreground tracking-wide">
              Режим
            </label>
            <div className="flex gap-4">
              {(['closed', 'short'] as const).map(v => (
                <label
                  key={v}
                  className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-foreground cursor-pointer"
                >
                  <input
                    type="radio"
                    value={v}
                    checked={mode === v}
                    onChange={() => setMode(v)}
                    disabled={isPending}
                    className="accent-indigo-600"
                  />
                  {v === 'closed' ? 'Зачинено' : 'Скорочений день'}
                </label>
              ))}
            </div>
          </div>

          {mode === 'short' && (
            <div className="flex items-end gap-2">
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-muted-foreground tracking-wide">
                  Від
                </label>
                <Input
                  type="time"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <span className="text-slate-400 pb-2.5">—</span>
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-muted-foreground tracking-wide">
                  До
                </label>
                <Input
                  type="time"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-muted-foreground tracking-wide">
              Примітка
            </label>
            <Input
              placeholder="Наприклад: Новий рік"
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={isPending}
            />
          </div>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !date}>
            {isPending ? 'Збереження…' : editingException ? 'Зберегти' : 'Додати'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { ExceptionModal }
