'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Button, Input,
} from '@pkg/ui'
import { createSubcategory, updateSubcategory } from '@/actions/categories'
import type { ISubcategoryDialogProps } from './types'

const SubcategoryDialog = ({
  mode,
  open,
  onOpenChange,
  onSuccess,
  categoryName,
  categoryId,
  subcategoryId,
  initial,
}: ISubcategoryDialogProps) => {
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
          await createSubcategory({
            categoryId: categoryId!,
            name: name.trim(),
            sortOrder: parseInt(sortOrder) || 0,
          })
        } else {
          await updateSubcategory({
            subcategoryId: subcategoryId!,
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
            {mode === 'create' ? 'Нова підкатегорія' : 'Редагувати підкатегорію'}
          </DialogTitle>
          <DialogDescription>
            {categoryName ? `Категорія: ${categoryName}` : 'Введіть назву підкатегорії.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Назва *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Наприклад: Йогурти"
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

export { SubcategoryDialog }
