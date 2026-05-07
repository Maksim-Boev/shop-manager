import { SearchIcon, LayoutGridIcon, TableIcon } from 'lucide-react'
import { Input, Button } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { TViewMode, TStatusFilter, IShopsFilterProps } from './types'

const STATUS_OPTIONS: { label: string; value: TStatusFilter }[] = [
  { label: 'Всі',             value: 'ALL' },
  { label: 'Активні',         value: 'ACTIVE' },
  { label: 'Працюють зараз',  value: 'OPEN_NOW' },
  { label: 'Архівовані',      value: 'ARCHIVED' },
]

const ShopsFilter = ({
  search, onSearch,
  statusFilter, onStatusFilter,
  viewMode, onViewMode,
}: IShopsFilterProps) => (
  <div className="flex items-center gap-3 flex-wrap">
    <div className="relative flex-1 min-w-48">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder="Пошук за назвою або адресою…"
        value={search}
        onChange={e => onSearch(e.target.value)}
        className="pl-9"
      />
    </div>

    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-muted/40 rounded-lg">
      {STATUS_OPTIONS.map(o => (
        <button
          key={o.value}
          onClick={() => onStatusFilter(o.value)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            statusFilter === o.value
              ? 'bg-white shadow-sm text-slate-900 dark:bg-card dark:text-foreground'
              : 'text-slate-500 hover:text-slate-700 dark:text-muted-foreground dark:hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>

    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-muted/40 rounded-lg">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onViewMode('grid')}
        title="Сітка"
        className={cn(viewMode === 'grid' && 'bg-white shadow-sm text-slate-900 dark:bg-card dark:text-foreground')}
      >
        <LayoutGridIcon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onViewMode('table')}
        title="Таблиця"
        className={cn(viewMode === 'table' && 'bg-white shadow-sm text-slate-900 dark:bg-card dark:text-foreground')}
      >
        <TableIcon className="size-4" />
      </Button>
    </div>
  </div>
)

export { ShopsFilter }
