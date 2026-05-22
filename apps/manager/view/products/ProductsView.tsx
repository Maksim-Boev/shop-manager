'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { Button, Card, CardContent, Tabs, TabsList, TabsTrigger, TabsContent } from '@pkg/ui'
import { ProductsFilter } from './components/products-filter'
import { ProductsTable } from './components/products-table'
import { AddProductDialog } from './components/add-product-dialog'
import { CategoriesTab } from './components/categories-tab'
import type { IProductsViewProps } from './types'

const ProductsView = ({
  defaultTab,
  categories,
  products = [],
  taxRates = [],
}: IProductsViewProps) => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('ALL')
  const [status, setStatus] = useState('ACTIVE')
  const [addOpen, setAddOpen] = useState(false)

  const filtered = products.filter(product => {
    if (status !== 'ALL' && product.status !== status) return false
    if (categoryId !== 'ALL' && product.categoryId !== categoryId) return false
    if (search) {
      const q = search.toLowerCase()
      return product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q)
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
        {defaultTab === 'products' && (
          <Button onClick={() => setAddOpen(true)}>
            <PlusIcon className="size-4" />
            Додати товар
          </Button>
        )}
      </div>

      <Tabs value={defaultTab} onValueChange={(tab) => router.replace(`/products?tab=${tab}`)}>
        <TabsList variant="line">
          <TabsTrigger value="products">Товари</TabsTrigger>
          <TabsTrigger value="categories">Категорії</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4 flex flex-col gap-4">
          <Card className="py-0">
            <CardContent className="p-4">
              <ProductsFilter
                categories={categories}
                search={search}
                categoryId={categoryId}
                status={status}
                onSearch={setSearch}
                onCategory={setCategoryId}
                onStatus={setStatus}
              />
            </CardContent>
          </Card>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <ProductsTable products={filtered} />
          </div>

          <AddProductDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            categories={categories}
            taxRates={taxRates}
          />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoriesTab categories={categories} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { ProductsView }
