'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PackageIcon, TruckIcon } from 'lucide-react'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button,
} from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { StockFilter } from '../stock-filter'
import type { IStockTableProps } from './types'

const fmtUAH = (n: number) =>
  `₴ ${n.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const StockTable = ({ rows, warehouseId }: IStockTableProps) => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')

  const categories = useMemo(
    () => Array.from(new Set(rows.map(r => r.category))).sort((a, b) => a.localeCompare(b, 'uk')),
    [rows],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter(r => {
      const matchesSearch =
        r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q)
      const matchesCategory = category === 'ALL' || r.category === category
      return matchesSearch && matchesCategory
    })
  }, [rows, search, category])

  return (
    <div className="space-y-4">
      <StockFilter
        search={search} onSearch={setSearch}
        category={category} onCategory={setCategory}
        categories={categories}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-muted-foreground">
          <p className="text-sm">Записів не знайдено</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Товар</TableHead>
              <TableHead>Категорія</TableHead>
              <TableHead className="text-right">Центр. склад</TableHead>
              <TableHead className="text-right">В магазинах</TableHead>
              <TableHead className="text-right">Разом</TableHead>
              <TableHead className="text-right">Вартість</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(r => {
              const isOut = r.stock === 0
              const isLow = r.stock > 0 && r.stock < 10
              return (
                <TableRow key={r.productId} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 dark:from-muted/40 dark:to-muted/20 dark:border-border flex items-center justify-center text-slate-400 dark:text-muted-foreground shrink-0">
                        <PackageIcon className="size-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-foreground text-sm">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-muted-foreground font-mono">
                          {r.sku}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-muted-foreground">
                    {r.category}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={cn(
                      'font-semibold',
                      isOut
                        ? 'text-rose-600 dark:text-rose-300'
                        : isLow
                          ? 'text-amber-600 dark:text-amber-300'
                          : 'text-slate-900 dark:text-foreground',
                    )}>
                      {r.stock.toLocaleString('uk-UA')}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-muted-foreground ml-1">
                      {r.unit.toLowerCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-700 dark:text-muted-foreground">
                    {r.shopTotal.toLocaleString('uk-UA')}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-bold text-slate-900 dark:text-foreground">
                    {r.totalQty.toLocaleString('uk-UA')}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-900 dark:text-foreground">
                    {fmtUAH(r.totalValue)}
                  </TableCell>
                  <TableCell className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="gap-1.5"
                    >
                      <Link href={`/transfers/new?from=${warehouseId}&productId=${r.productId}`}>
                        <TruckIcon className="size-3.5" />
                        Перемістити
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export { StockTable }
