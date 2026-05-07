'use client'

import { SearchIcon } from 'lucide-react'
import {
  Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@pkg/ui'
import type { IStockFilterProps } from './types'

const StockFilter = ({
  search, onSearch, category, onCategory, categories,
}: IStockFilterProps) => (
  <div className="flex items-center gap-3 flex-wrap">
    <div className="relative flex-1 min-w-48">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder="Пошук за назвою або SKU…"
        value={search}
        onChange={e => onSearch(e.target.value)}
        className="pl-9"
      />
    </div>
    <Select value={category} onValueChange={onCategory}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Усі категорії" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Усі категорії</SelectItem>
        {categories.map(c => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

export { StockFilter }
