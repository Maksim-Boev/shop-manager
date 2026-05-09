import { SearchIcon } from 'lucide-react'
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pkg/ui'
import type { IProductsFilterProps } from './types'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Усі статуси' },
  { value: 'ACTIVE', label: 'Активні' },
  { value: 'ARCHIVED', label: 'Архівовані' },
]

const ProductsFilter = ({
  categories, search, categoryId, status,
  onSearch, onCategory, onStatus,
}: IProductsFilterProps) => (
  <div className="flex flex-col sm:flex-row gap-3">
    <div className="relative flex-1">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Пошук за назвою або SKU..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        className="pl-9"
      />
    </div>

    <Select value={categoryId} onValueChange={onCategory}>
      <SelectTrigger className="w-full sm:w-48">
        <SelectValue placeholder="Категорія" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Усі категорії</SelectItem>
        {categories.map(c => (
          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Select value={status} onValueChange={onStatus}>
      <SelectTrigger className="w-full sm:w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map(o => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

export { ProductsFilter }
