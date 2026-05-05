import Link from 'next/link'
import { ActivityIcon, ChevronRightIcon } from 'lucide-react'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Badge, Button,
} from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { IShopsTableProps } from '../types'

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
          <TableHead className="text-right">Виручка</TableHead>
          <TableHead className="text-right">Залишки</TableHead>
          <TableHead className="text-right">Менеджери</TableHead>
          <TableHead className="text-center">Зміна</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {shops.map(shop => {
          const hasStockAlert = shop.outOfStockCount > 0 || shop.lowStockCount > 0
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
                <ActivityIcon className={cn(
                  'size-4 mx-auto',
                  shop.hasOpenShift ? 'text-emerald-500' : 'text-slate-300',
                )} />
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
