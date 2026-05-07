import { PackageIcon } from 'lucide-react'
import { Card, CardContent } from '@pkg/ui'
import { WarehouseSelector } from './components/warehouse-selector'
import { StockTable } from './components/stock-table'
import { PurchaseOrdersSection } from './components/purchase-orders-section'
import type { IWarehouseViewProps } from './types'

const WarehouseView = ({
  warehouses, activeWarehouse, stock, pendingOrders,
}: IWarehouseViewProps) => {
  if (warehouses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <PackageIcon className="size-10 text-slate-300 dark:text-muted-foreground" />
          <p className="text-slate-500 dark:text-muted-foreground">У вас немає складів</p>
          <p className="text-xs text-slate-400 dark:text-muted-foreground">
            Створіть склад у розділі Налаштування
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!activeWarehouse) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-slate-400 dark:text-muted-foreground">
          Склад не знайдено
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-foreground tracking-tight">
            Центральний склад
          </h1>
          {activeWarehouse.address && (
            <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
              {activeWarehouse.address}
            </p>
          )}
        </div>
        {warehouses.length > 1 && (
          <WarehouseSelector warehouses={warehouses} activeId={activeWarehouse.id} />
        )}
      </div>

      <Card>
        <CardContent>
          <h3 className="text-base font-bold text-slate-900 dark:text-foreground mb-4">Залишки</h3>
          <StockTable rows={stock} />
        </CardContent>
      </Card>

      <PurchaseOrdersSection orders={pendingOrders} />
    </div>
  )
}

export { WarehouseView }
