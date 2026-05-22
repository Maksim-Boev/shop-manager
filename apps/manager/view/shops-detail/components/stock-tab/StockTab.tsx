'use client'

import { useState, useMemo } from 'react'
import { PackageIcon, PencilIcon } from 'lucide-react'
import { cn } from '@pkg/ui/cn'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button } from '@pkg/ui'
import { StockFilter } from './StockFilter'
import { EditProductModal } from '../edit-product-modal'
import { AdjustStockDialog } from './components/adjust-stock-dialog'
import type { IEditProductModalProduct } from '../edit-product-modal'
import type { IStockTabProps } from './types'

const UNIT_LABELS: Record<string, string> = {
  PIECE: 'шт.', KG: 'кг', GRAM: 'г', LITER: 'л',
  MILLILITER: 'мл', METER: 'м', PACK: 'уп.',
}

const StockTab = ({ items, storeId, allProducts }: IStockTabProps) => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)
  const [editProduct, setEditProduct] = useState<IEditProductModalProduct | null>(null)
  const [adjustOpen, setAdjustOpen] = useState(false)

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category))].sort(),
    [items],
  )

  const currentStock = useMemo(
    () => new Map(items.map((item) => [item.productId, item.stock])),
    [items],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(i => {
      if (q && !i.name.toLowerCase().includes(q) && !i.sku.toLowerCase().includes(q))
        return false
      if (category && i.category !== category) return false
      if (onlyLow && i.stock >= 10) return false
      return true
    })
  }, [items, search, category, onlyLow])

  const totalValue = filtered.reduce((s, i) => s + i.stock * i.effectivePrice, 0)

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <StockFilter
        search={search} category={category} onlyLow={onlyLow} categories={categories}
        onSearch={setSearch} onCategory={setCategory} onOnlyLow={setOnlyLow}
        actions={
          <Button variant="outline" size="sm" className="shrink-0 whitespace-nowrap" onClick={() => setAdjustOpen(true)}>
            Коригування залишків
          </Button>
        }
      />

      {/* Summary bar */}
      <div className="px-5 py-2.5 border-b border-slate-100 dark:border-border flex items-center justify-between text-xs text-slate-500 dark:text-muted-foreground">
        <span>Показано {filtered.length} з {items.length} SKU</span>
        <span>
          Вартість залишків:{' '}
          <span className="font-semibold text-slate-700 dark:text-foreground/90 tabular-nums">
            ₴ {totalValue.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}
          </span>
        </span>
      </div>

      <Table>
        <TableHeader className="bg-slate-50/60 dark:bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-auto px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Товар</TableHead>
            <TableHead className="h-auto px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Категорія</TableHead>
            <TableHead className="h-auto px-5 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Залишок</TableHead>
            <TableHead className="h-auto px-5 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Ціна</TableHead>
            <TableHead className="h-auto px-5 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Закуп</TableHead>
            <TableHead className="h-auto px-5 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Маржа</TableHead>
            <TableHead className="h-auto px-5 py-3 text-center text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Статус</TableHead>
            <TableHead className="h-auto px-5 py-3 w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(item => (
            <TableRow
              key={item.productId}
              className={cn(
                'hover:bg-slate-50/60 dark:hover:bg-muted/40',
                item.stock === 0 && 'bg-rose-50/30 dark:bg-rose-500/5',
              )}
            >
              <TableCell className="px-5 py-3 whitespace-normal">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 dark:bg-muted dark:border-border flex items-center justify-center text-slate-400 dark:text-muted-foreground shrink-0">
                    <PackageIcon className="size-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-foreground">{item.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-muted-foreground flex items-center gap-1.5">
                      <span className="font-mono">{item.sku}</span>
                      <span>·</span>
                      <span>{UNIT_LABELS[item.unit] ?? item.unit}</span>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-5 py-3 text-slate-600 dark:text-muted-foreground">{item.category}</TableCell>
              <TableCell
                className={cn(
                  'px-5 py-3 text-right font-semibold tabular-nums',
                  item.stock === 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : item.stock < 10
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-900 dark:text-foreground',
                )}
              >
                {item.stock} {UNIT_LABELS[item.unit] ?? 'шт.'}
              </TableCell>
              <TableCell className="px-5 py-3 text-right tabular-nums text-slate-900 dark:text-foreground font-medium">
                ₴ {item.effectivePrice.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-foreground/90">
                {item.costPrice === null
                  ? <span className="text-slate-300 dark:text-muted-foreground/60">—</span>
                  : `₴ ${item.costPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}`}
              </TableCell>
              <TableCell
                className={cn(
                  'px-5 py-3 text-right tabular-nums font-semibold',
                  item.marginPct === null
                    ? 'text-slate-300 dark:text-muted-foreground/60'
                    : item.marginPct < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400',
                )}
              >
                {item.marginPct === null
                  ? '—'
                  : `${item.marginPct >= 0 ? '+' : ''}${item.marginPct.toFixed(1)}%`}
              </TableCell>
              <TableCell className="px-5 py-3 text-center">
                {item.isAvailable ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    Доступний
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 dark:bg-muted dark:text-muted-foreground">
                    Недоступний
                  </span>
                )}
              </TableCell>
              <TableCell className="px-5 py-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setEditProduct({
                      id: item.productId,
                      sku: item.sku,
                      name: item.name,
                      unit: item.unit,
                      basePrice: item.basePrice,
                      costPrice: item.costPrice,
                    })
                  }
                >
                  <PencilIcon className="size-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={8} className="px-5 py-12 text-center text-sm text-slate-400 dark:text-muted-foreground">
                Нічого не знайдено
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <EditProductModal
        open={editProduct !== null}
        onOpenChange={v => { if (!v) setEditProduct(null) }}
        product={editProduct}
      />
      <AdjustStockDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        storeId={storeId}
        allProducts={allProducts}
        currentStock={currentStock}
      />
    </div>
  )
}

export { StockTab }
