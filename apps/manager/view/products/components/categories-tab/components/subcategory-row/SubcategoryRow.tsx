'use client'

import { useState, useTransition } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@pkg/ui'
import { deleteSubcategory } from '@/actions/categories'
import { SubcategoryDialog } from '../subcategory-dialog'
import type { ISubcategoryRowProps } from './types'

const SubcategoryRow = ({ subcategory, categoryName, onMutation }: ISubcategoryRowProps) => {
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      try {
        await deleteSubcategory({ subcategoryId: subcategory.id })
        onMutation()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Помилка видалення')
      }
    })
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-11 py-2 hover:bg-muted/30 transition-colors">
        <span className="flex-1 text-sm text-foreground">{subcategory.name}</span>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditOpen(true)}
            disabled={isPending}
          >
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            variant="ghost-destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 px-11 pb-1">{error}</p>
      )}

      <SubcategoryDialog
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        subcategoryId={subcategory.id}
        categoryName={categoryName}
        onSuccess={onMutation}
        initial={subcategory}
      />
    </div>
  )
}

export { SubcategoryRow }
