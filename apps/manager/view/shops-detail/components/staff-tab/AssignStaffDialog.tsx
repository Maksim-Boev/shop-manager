'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Button,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@pkg/ui'
import { assignStaffToShop } from '@/actions/shop'
import type { IAssignStaffDialogProps, TAssignableRole } from './types'

const ROLE_LABELS: Record<TAssignableRole, { title: string; description: string }> = {
  MANAGER: {
    title: 'Призначити менеджера',
    description: 'Оберіть співробітника для призначення керуючим цього магазину.',
  },
  CASHIER: {
    title: 'Призначити касира',
    description: 'Оберіть касира для роботи в цьому магазині.',
  },
  SALESPERSON: {
    title: 'Призначити продавця',
    description: 'Оберіть продавця торгового залу для цього магазину.',
  },
}

const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Адміністратор',
  MANAGER: 'Менеджер',
  CASHIER: 'Касир',
  SALESPERSON: 'Продавець',
}

const AssignStaffDialog = ({
  shopId, availableUsers, open, onOpenChange, targetRole,
}: IAssignStaffDialogProps) => {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = availableUsers.filter(u =>
    targetRole === 'MANAGER'
      ? (u.role === 'MANAGER' || u.role === 'ADMIN')
      : u.role === targetRole,
  )

  const handleClose = (v: boolean) => {
    if (isPending) return
    if (!v) { setSelectedId(''); setError(null) }
    onOpenChange(v)
  }

  const handleSubmit = () => {
    if (!selectedId) return
    setError(null)
    startTransition(async () => {
      try {
        await assignStaffToShop(shopId, selectedId)
        setSelectedId('')
        onOpenChange(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      }
    })
  }

  const labels = ROLE_LABELS[targetRole]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-muted-foreground py-4 text-center">
            Немає доступних співробітників для призначення
          </p>
        ) : (
          <Select value={selectedId} onValueChange={setSelectedId} disabled={isPending}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Оберіть співробітника" />
            </SelectTrigger>
            <SelectContent>
              {filtered.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} — {USER_ROLE_LABELS[u.role] ?? u.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={isPending}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !selectedId || filtered.length === 0}>
            {isPending ? 'Призначення…' : 'Призначити'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { AssignStaffDialog }
