import { Card, CardContent, CardHeader } from '@pkg/ui'
import type { IProductPricingCardProps } from './types'

const fmt = (n: number) =>
  n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ProductPricingCard = ({ basePrice, costPrice }: IProductPricingCardProps) => {
  const margin =
    costPrice !== null && basePrice > 0
      ? ((basePrice - costPrice) / basePrice) * 100
      : null

  const marginColor =
    margin === null ? 'text-muted-foreground' :
    margin >= 20 ? 'text-emerald-600 dark:text-emerald-400' :
    margin >= 0 ? 'text-amber-600 dark:text-amber-400' :
    'text-rose-600 dark:text-rose-400'

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-foreground">Ціноутворення</h3>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Ціна продажу</span>
            <span className="text-xl font-bold text-foreground">{fmt(basePrice)}</span>
            <span className="text-xs text-muted-foreground">грн.</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Закупна ціна</span>
            <span className="text-xl font-bold text-foreground">
              {costPrice !== null ? fmt(costPrice) : '—'}
            </span>
            {costPrice !== null && <span className="text-xs text-muted-foreground">грн.</span>}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Маржа</span>
            <span className={`text-xl font-bold ${marginColor}`}>
              {margin !== null ? `${margin.toFixed(1)}%` : '—'}
            </span>
            {margin !== null && (
              <span className="text-xs text-muted-foreground">
                {fmt(basePrice - (costPrice ?? 0))} грн.
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { ProductPricingCard }
