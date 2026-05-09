'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@pkg/ui'
import { ProductsFilter } from './components/products-filter'
import { ProductsTable } from './components/products-table'
import { AddProductDialog } from './components/add-product-dialog'
import type { IProductsViewProps } from './types'

const ProductsView = ({ products, categories, taxRates }: IProductsViewProps) => {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('ALL')
  const [status, setStatus] = useState('ACTIVE')
  const [addOpen, setAddOpen] = useState(false)

  const filtered = products.filter(p => {
    if (status !== 'ALL' && p.status !== status) return false
    if (categoryId !== 'ALL' && p.categoryId !== categoryId) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Каталог товарів</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products.length} товарів у базі
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <PlusIcon className="size-4" />
          Додати товар
        </Button>
      </div>

      <ProductsFilter
        categories={categories}
        search={search}
        categoryId={categoryId}
        status={status}
        onSearch={setSearch}
        onCategory={setCategoryId}
        onStatus={setStatus}
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <ProductsTable products={filtered} />
      </div>

      <AddProductDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        categories={categories}
        taxRates={taxRates}
      />
    </div>
  )
}

export { ProductsView }
