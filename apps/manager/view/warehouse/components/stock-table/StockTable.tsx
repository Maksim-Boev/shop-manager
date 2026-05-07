'use client'

import { useMemo, useState } from 'react'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { StockFilter } from '../stock-filter'
import type { IStockTableProps } from './types'

const StockTable = ({ rows }: IStockTableProps) => {
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
              <TableHead>SKU</TableHead>
              <TableHead>Назва</TableHead>
              <TableHead>Категорія</TableHead>
              <TableHead className="text-right">Кількість</TableHead>
              <TableHead className="text-right">Ціна</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(r => {
              const isOut = r.stock === 0
              const isLow = r.stock > 0 && r.stock < 10
              return (
                <TableRow key={r.productId}>
                  <TableCell className="font-mono text-xs text-slate-500 dark:text-muted-foreground">
                    {r.sku}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900 dark:text-foreground">{r.name}</div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-muted-foreground">
                    {r.category}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={cn(
                      isOut
                        ? 'text-rose-600 dark:text-rose-300 font-bold'
                        : isLow
                          ? 'text-amber-600 dark:text-amber-300 font-medium'
                          : 'text-slate-900 dark:text-foreground',
                    )}>
                      {r.stock.toLocaleString('uk-UA')}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-muted-foreground ml-1">
                      {r.unit.toLowerCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-900 dark:text-foreground">
                    ₴ {r.effectivePrice.toFixed(2)}
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
