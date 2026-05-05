import Link from 'next/link'
import { MapPinIcon, UsersIcon, ActivityIcon, ChevronRightIcon } from 'lucide-react'
import { Card, CardContent, CardFooter, Badge, Button } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { IShopCardProps } from '../types'

const ShopCard = ({ shop }: IShopCardProps) => {
  const isArchived = shop.status === 'ARCHIVED'
  const hasStockAlert = shop.outOfStockCount > 0 || shop.lowStockCount > 0

  return (
    <Card className={cn(isArchived && 'opacity-60')}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{shop.name}</h3>
            {shop.address && (
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <MapPinIcon className="size-3 shrink-0" />
                <span className="truncate">{shop.address}</span>
              </div>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0',
              isArchived
                ? 'border-slate-200 bg-slate-100 text-slate-500'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700',
            )}
          >
            {isArchived ? 'Архів' : 'Активний'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-500">Виручка сьогодні</div>
            <div className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
              ₴ {Number(shop.revenueToday).toLocaleString('uk-UA')}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Залишки</div>
            <div className={cn(
              'text-sm font-bold mt-0.5 tabular-nums',
              hasStockAlert ? 'text-amber-600' : 'text-slate-900',
            )}>
              {Number(shop.stockTotal).toLocaleString('uk-UA')} од.
            </div>
            {hasStockAlert && (
              <div className="text-xs text-amber-600 mt-0.5">
                {shop.outOfStockCount > 0 && `${shop.outOfStockCount} SKU — нуль`}
                {shop.outOfStockCount > 0 && shop.lowStockCount > 0 && '; '}
                {shop.lowStockCount > 0 && `${shop.lowStockCount} — мало`}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <UsersIcon className="size-3.5" />
            {shop.managersCount} менедж.
          </span>
          <span className={cn(
            'flex items-center gap-1',
            shop.hasOpenShift ? 'text-emerald-600' : 'text-slate-400',
          )}>
            <ActivityIcon className="size-3.5" />
            {shop.hasOpenShift ? 'Зміна відкрита' : 'Зміна закрита'}
          </span>
        </div>
        <Button variant="link" size="sm" asChild>
          <Link href={`/shops/${shop.id}`} className="inline-flex items-center gap-1">
            Деталі <ChevronRightIcon className="size-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export { ShopCard }
