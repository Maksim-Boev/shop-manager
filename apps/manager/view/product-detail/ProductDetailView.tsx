import { Badge } from '@pkg/ui'
import { ProductBreadcrumb } from './components/product-breadcrumb'
import { ProductInfoCard } from './components/product-info-card'
import { ProductPricingCard } from './components/product-pricing-card'
import { ProductStoresTable } from './components/product-stores-table'
import { ArchiveProductButton } from './components/archive-product-button'
import type { IProductDetailViewProps } from './types'

const ProductDetailView = ({ product, categories, taxRates, canEdit }: IProductDetailViewProps) => (
  <div className="flex flex-col gap-6">
    <ProductBreadcrumb productName={product.name} productId={product.id} />

    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
        {product.status === 'ARCHIVED' && (
          <Badge variant="secondary" className="bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400">
            Архів
          </Badge>
        )}
      </div>
      {canEdit && product.status === 'ACTIVE' && (
        <ArchiveProductButton productId={product.id} productName={product.name} />
      )}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 flex flex-col gap-6">
        <ProductInfoCard
          product={product}
          categories={categories}
          taxRates={taxRates}
          canEdit={canEdit}
        />
        <ProductPricingCard basePrice={product.basePrice} costPrice={product.costPrice} />
      </div>

      <div className="lg:col-span-2">
        <ProductStoresTable stores={product.stores} />
      </div>
    </div>
  </div>
)

export { ProductDetailView }
