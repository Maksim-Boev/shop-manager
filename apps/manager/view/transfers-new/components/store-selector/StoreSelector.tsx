'use client'

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@pkg/ui'
import type { IStoreSelectorProps } from './types'

const StoreSelector = ({
  label, value, onChange, stores, disabledId,
}: IStoreSelectorProps) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-700 dark:text-foreground">
      {label}
    </label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Оберіть магазин" />
      </SelectTrigger>
      <SelectContent>
        {stores.map(s => (
          <SelectItem
            key={s.id}
            value={s.id}
            disabled={s.id === disabledId}
          >
            <span>{s.name}</span>
            <span className="text-xs text-slate-400 dark:text-muted-foreground ml-2">
              {s.type === 'SHOP' ? 'магазин' : 'склад'}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

export { StoreSelector }
