'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Button, Input,
} from '@pkg/ui'
import { createCategory, updateCategory } from '@/actions/categories'
import type { ICategoryDialogProps } from './types'

const CategoryDialog = ({
  mode,
  open,
  onOpenChange,
  onSuccess,
  initial,
}: ICategoryDialogProps) => {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(initial?.name ?? '')
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0))

  const handleClose = (v: boolean) => {
    if (isPending) return
    if (!v) {
      setName(initial?.name ?? '')
      setSortOrder(String(initial?.sortOrder ?? 0))
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
        if (mode === 'create') {
          await createCategory({ name: name.trim(), sortOrder: parseInt(sortOrder) || 0 })
        } else {
          await updateCategory({
            categoryId: initial!.id,
            name: name.trim(),
            sortOrder: parseInt(sortOrder) || 0,
          })
        }
        handleClose(false)
        onSuccess()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Нова категорія' : 'Редагувати категорію'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Введіть назву нової категорії товарів.'
              : 'Змініть назву або порядок сортування категорії.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Назва *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Наприклад: Молочні продукти"
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Порядок сортування</label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="0"
              disabled={isPending}
            />
          </div>
        </div>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={isPending}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Збереження…' : mode === 'create' ? 'Створити' : 'Зберегти'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { CategoryDialog }
