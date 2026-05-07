'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Button,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@pkg/ui'
import { assignManager } from '@/actions/shop'
import type { IAssignManagerDialogProps } from './types'

const ROLE_LABELS: Record<string, string> = {
  MANAGER: 'Менеджер',
  ADMIN: 'Адміністратор',
}

const AssignManagerDialog = ({
  shopId, availableUsers, open, onOpenChange,
}: IAssignManagerDialogProps) => {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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
        await assignManager(shopId, selectedId)
        setSelectedId('')
        onOpenChange(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Призначити менеджера</DialogTitle>
          <DialogDescription>
            Оберіть співробітника для призначення керуючим цього магазину.
          </DialogDescription>
        </DialogHeader>

        {availableUsers.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-muted-foreground py-4 text-center">
            Немає доступних співробітників для призначення
          </p>
        ) : (
          <Select value={selectedId} onValueChange={setSelectedId} disabled={isPending}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Оберіть співробітника" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} — {ROLE_LABELS[u.role] ?? u.role}
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
          <Button
            onClick={handleSubmit}
            disabled={isPending || !selectedId || availableUsers.length === 0}
          >
            {isPending ? 'Призначення…' : 'Призначити'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { AssignManagerDialog }
