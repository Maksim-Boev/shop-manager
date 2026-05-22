'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { Button } from '@pkg/ui'
import { CategoryRow } from './components/category-row'
import { CategoryDialog } from './components/category-dialog'
import type { ICategoriesTabProps } from './types'

const CategoriesTab = ({ categories }: ICategoriesTabProps) => {
  const router = useRouter()
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null)
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)

  const handleMutation = () => router.refresh()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} категорій
        </p>
        <Button onClick={() => setAddCategoryOpen(true)}>
          <PlusIcon className="size-4" />
          Додати категорію
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
          <p className="text-sm text-muted-foreground">Категорій ще немає</p>
          <p className="text-xs text-muted-foreground">
            Додайте першу, щоб мати змогу створювати товари
          </p>
          <Button variant="outline" onClick={() => setAddCategoryOpen(true)}>
            <PlusIcon className="size-4" />
            Додати категорію
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              isOpen={openCategoryId === category.id}
              onToggle={() =>
                setOpenCategoryId((prev) => (prev === category.id ? null : category.id))
              }
              onMutation={handleMutation}
            />
          ))}
        </div>
      )}

      <CategoryDialog
        mode="create"
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onSuccess={handleMutation}
      />
    </div>
  )
}

export { CategoriesTab }
