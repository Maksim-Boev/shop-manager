'use client'

import { SearchIcon, AlertTriangleIcon } from 'lucide-react'
import { Input } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { IStockFilterProps } from './types'

const StockFilter = ({
  search, category, onlyLow, categories,
  onSearch, onCategory, onOnlyLow,
}: IStockFilterProps) => (
  <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100 dark:border-border">
    <div className="relative flex-1">
      <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 dark:text-muted-foreground pointer-events-none" />
      <Input
        className="pl-8"
        placeholder="Пошук за назвою або артикулом…"
        value={search}
        onChange={e => onSearch(e.target.value)}
      />
    </div>
    <select
      value={category}
      onChange={e => onCategory(e.target.value)}
      className="h-9 rounded-md border border-slate-200 bg-white text-slate-700 dark:bg-card dark:border-border dark:text-foreground px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option value="">Усі категорії</option>
      {categories.map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
    <button
      onClick={() => onOnlyLow(!onlyLow)}
      className={cn(
        'flex items-center gap-1.5 px-3 h-9 rounded-md border text-sm font-medium transition-colors',
        onlyLow
          ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-border dark:text-muted-foreground dark:hover:bg-muted/40',
      )}
    >
      <AlertTriangleIcon className="size-3.5" />
      Низькі залишки
    </button>
  </div>
)

export { StockFilter }
