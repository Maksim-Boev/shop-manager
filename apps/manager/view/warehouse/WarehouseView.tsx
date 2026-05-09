import { PackageIcon, CoinsIcon, WarehouseIcon, TruckIcon } from 'lucide-react'
import { Card, CardContent } from '@pkg/ui'
import { WarehouseSelector } from './components/warehouse-selector'
import { StockTable } from './components/stock-table'
import { PurchaseOrdersSection } from './components/purchase-orders-section'
import type { IWarehouseViewProps } from './types'

const fmtNum = (n: number) =>
  n.toLocaleString('uk-UA')

const fmtUAH = (n: number) =>
  `₴ ${n.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const WarehouseView = ({
  warehouses, activeWarehouse, stock, pendingOrders, inTransitCount,
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

  const totalSkus = stock.length
  const warehouseUnits = stock.reduce((s, r) => s + r.stock, 0)
  const totalValue = stock.reduce((s, r) => s + r.totalValue, 0)

  const kpis = [
    {
      label: 'SKU в каталозі',
      value: fmtNum(totalSkus),
      icon: PackageIcon,
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    },
    {
      label: 'Вартість залишків',
      value: fmtUAH(totalValue),
      icon: CoinsIcon,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    },
    {
      label: 'На центр. складі',
      value: fmtNum(warehouseUnits),
      sub: 'Одиниць',
      icon: WarehouseIcon,
      iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    },
    {
      label: 'В дорозі',
      value: String(inTransitCount),
      sub: 'Активних накладних',
      icon: TruckIcon,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-foreground tracking-tight">
            Центральний склад
          </h1>
          <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
            {fmtNum(totalSkus)} SKU · {fmtUAH(totalValue)}
          </p>
        </div>
        {warehouses.length > 1 && (
          <WarehouseSelector warehouses={warehouses} activeId={activeWarehouse.id} />
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                <kpi.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-500 dark:text-muted-foreground">{kpi.label}</div>
                <div className="text-lg font-bold text-slate-900 dark:text-foreground tabular-nums leading-tight">
                  {kpi.value}
                </div>
                {kpi.sub && (
                  <div className="text-[11px] text-slate-400 dark:text-muted-foreground">{kpi.sub}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent>
          <StockTable rows={stock} warehouseId={activeWarehouse.id} />
        </CardContent>
      </Card>

      <PurchaseOrdersSection orders={pendingOrders} />
    </div>
  )
}

export { WarehouseView }
