'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Button, Input,
} from '@pkg/ui'
import { createCategory } from '@/actions/categories'
import type { IQuickAddCategoryDialogProps } from './types'

const QuickAddCategoryDialog = ({ open, onOpenChange, onCreated }: IQuickAddCategoryDialogProps) => {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')

  const handleClose = (v: boolean) => {
    if (isPending) return
    if (!v) {
      setName('')
      setError(null)
    }
    onOpenChange(v)
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Назва обов'язкова")
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const { id } = await createCategory({ name: name.trim(), sortOrder: 0 })
        handleClose(false)
        onCreated(id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Нова категорія</DialogTitle>
          <DialogDescription>
            Введіть назву — категорія одразу стане доступною для вибору.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Назва *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Наприклад: Молочні продукти"
            disabled={isPending}
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={isPending}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Створення…' : 'Створити'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { QuickAddCategoryDialog }
