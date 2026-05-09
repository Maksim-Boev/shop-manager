'use client'

import { useState, useTransition } from 'react'
import { Trash2Icon } from 'lucide-react'
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@pkg/ui'
import { deleteStaffMember } from '@/actions/staff'
import type { IDeleteStaffButtonProps } from './types'

const DeleteStaffButton = ({ userId, displayName }: IDeleteStaffButtonProps) => {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      try {
        await deleteStaffMember({ userId })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Помилка видалення')
      }
    })
  }

  return (
    <>
      <Button
        variant="outline-destructive"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Trash2Icon className="size-4" />
        Видалити
      </Button>

      <Dialog open={open} onOpenChange={v => { if (!pending) setOpen(v) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видалити співробітника?</DialogTitle>
            <DialogDescription>
              Акаунт {displayName} буде видалено. Історія замовлень та змін збережеться.
              Цю дію не можна скасувати.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p className="text-sm text-rose-600 dark:text-rose-300 -mt-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Скасувати
            </Button>
            <Button
              variant="destructive-solid"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending ? 'Видаляю…' : 'Так, видалити'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { DeleteStaffButton }
