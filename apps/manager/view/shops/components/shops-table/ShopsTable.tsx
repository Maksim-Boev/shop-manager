import Link from 'next/link'
import { ChevronRightIcon } from 'lucide-react'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Badge, Button,
} from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { getShopOpenStatus, formatWeeklySchedule } from '@pkg/db/utils/shop-status'
import type { IShopsTableProps } from './types'

const ShopsTable = ({ shops }: IShopsTableProps) => {
  if (shops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <p className="text-sm">Магазини не знайдені</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Назва</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Графік</TableHead>
          <TableHead className="text-right">Виручка</TableHead>
          <TableHead className="text-right">Залишки</TableHead>
          <TableHead className="text-right">Менеджери</TableHead>
          <TableHead className="text-center">Стан</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {shops.map(shop => {
          const hasStockAlert = shop.outOfStockCount > 0 || shop.lowStockCount > 0
          const workingNow = shop.status !== 'ARCHIVED' && getShopOpenStatus(shop.weeklySchedule, shop.scheduleExceptions) === 'open'
          const scheduleSummary = formatWeeklySchedule(shop.weeklySchedule)
          return (
            <TableRow key={shop.id}>
              <TableCell>
                <div className="font-medium text-slate-900">{shop.name}</div>
                {shop.address && (
                  <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{shop.address}</div>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    shop.status === 'ARCHIVED'
                      ? 'border-slate-200 bg-slate-100 text-slate-500'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  )}
                >
                  {shop.status === 'ARCHIVED' ? 'Архів' : 'Активний'}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-slate-600 dark:text-muted-foreground whitespace-nowrap">
                {scheduleSummary ?? <span className="text-slate-400 dark:text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium text-slate-900">
                ₴ {Number(shop.revenueToday).toLocaleString('uk-UA')}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className={cn(hasStockAlert ? 'text-amber-600 font-medium' : 'text-slate-900')}>
                  {Number(shop.stockTotal).toLocaleString('uk-UA')}
                </span>
                {shop.outOfStockCount > 0 && (
                  <div className="text-xs text-amber-500">{shop.outOfStockCount} нуль</div>
                )}
              </TableCell>
              <TableCell className="text-right text-slate-700">{shop.managersCount}</TableCell>
              <TableCell className="text-center">
                {shop.status === 'ARCHIVED' ? (
                  <span className="text-slate-400 dark:text-muted-foreground">—</span>
                ) : workingNow ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Відкритий
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-white text-slate-600 dark:border-border dark:bg-card dark:text-muted-foreground gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Зачинений
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="link" size="sm" asChild>
                  <Link href={`/shops/${shop.id}`} className="inline-flex items-center gap-1">
                    Деталі <ChevronRightIcon className="size-3" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export { ShopsTable }
