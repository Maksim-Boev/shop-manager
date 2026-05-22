'use client'

import { useState, useTransition } from 'react'
import { ChevronRightIcon, PencilIcon, Trash2Icon, PlusIcon } from 'lucide-react'
import { Button } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { deleteCategory } from '@/actions/categories'
import { SubcategoryRow } from '../subcategory-row'
import { CategoryDialog } from '../category-dialog'
import { SubcategoryDialog } from '../subcategory-dialog'
import type { ICategoryRowProps } from './types'

const CategoryRow = ({ category, isOpen, onToggle, onMutation }: ICategoryRowProps) => {
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [addSubOpen, setAddSubOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      try {
        await deleteCategory({ categoryId: category.id })
        onMutation()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Помилка видалення')
      }
    })
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
        <button
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ChevronRightIcon
            className={cn('size-4 transition-transform', isOpen && 'rotate-90')}
          />
        </button>

        <span className="flex-1 text-sm font-medium text-foreground">{category.name}</span>

        {category.subcategories.length > 0 && (
          <span className="text-xs text-muted-foreground shrink-0">
            {category.subcategories.length} підкат.
          </span>
        )}

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
        <p className="text-xs text-rose-600 dark:text-rose-400 px-11 pb-2">{error}</p>
      )}

      {isOpen && (
        <div className="border-t border-border bg-muted/20">
          {category.subcategories.length === 0 ? (
            <p className="text-xs text-muted-foreground px-11 py-2">Немає підкатегорій</p>
          ) : (
            category.subcategories.map((subcategory) => (
              <SubcategoryRow
                key={subcategory.id}
                subcategory={subcategory}
                categoryName={category.name}
                onMutation={onMutation}
              />
            ))
          )}
          <div className="px-11 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddSubOpen(true)}
            >
              <PlusIcon className="size-3.5" />
              Додати підкатегорію
            </Button>
          </div>
        </div>
      )}

      <CategoryDialog
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onMutation}
        initial={category}
      />

      <SubcategoryDialog
        mode="create"
        open={addSubOpen}
        onOpenChange={setAddSubOpen}
        categoryId={category.id}
        categoryName={category.name}
        onSuccess={onMutation}
      />
    </div>
  )
}

export { CategoryRow }
