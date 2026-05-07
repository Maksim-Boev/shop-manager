'use client'

import { SearchIcon } from 'lucide-react'
import {
  Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { IStaffFilterProps, TRoleFilter, TStatusFilter } from './types'

const ROLE_OPTIONS: { label: string; value: TRoleFilter }[] = [
  { label: 'Усі ролі',     value: 'ALL' },
  { label: 'Адміни',       value: 'ADMIN' },
  { label: 'Менеджери',    value: 'MANAGER' },
  { label: 'Касири',       value: 'CASHIER' },
]

const STATUS_OPTIONS: { label: string; value: TStatusFilter }[] = [
  { label: 'Усі',          value: 'ALL' },
  { label: 'Активні',      value: 'ACTIVE' },
  { label: 'Заблоковані',  value: 'BLOCKED' },
]

const StaffFilter = ({
  search, onSearch, role, onRole, status, onStatus, storeId, onStore, stores,
}: IStaffFilterProps) => (
  <div className="flex items-center gap-3 flex-wrap">
    <div className="relative flex-1 min-w-48">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder="Пошук за іменем або email…"
        value={search}
        onChange={e => onSearch(e.target.value)}
        className="pl-9"
      />
    </div>

    <Select value={role} onValueChange={v => onRole(v as TRoleFilter)}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map(o => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>

    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-muted/40 rounded-lg">
      {STATUS_OPTIONS.map(o => (
        <button
          key={o.value}
          onClick={() => onStatus(o.value)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            status === o.value
              ? 'bg-white shadow-sm text-slate-900 dark:bg-card dark:text-foreground'
              : 'text-slate-500 hover:text-slate-700 dark:text-muted-foreground dark:hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>

    <Select value={storeId} onValueChange={onStore}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Усі магазини" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Усі магазини</SelectItem>
        {stores.map(s => (
          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

export { StaffFilter }
