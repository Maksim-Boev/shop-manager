import { SearchIcon } from 'lucide-react'
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pkg/ui'
import type { IOrdersFilterProps } from './types'

const STATE_OPTIONS = [
  { value: 'ALL', label: 'Усі статуси' },
  { value: 'PAID', label: 'Оплачено' },
  { value: 'FULFILLED', label: 'Виконано' },
  { value: 'CANCELLED', label: 'Скасовано' },
  { value: 'REFUNDED', label: 'Повернено' },
  { value: 'PENDING', label: 'Очікує' },
]

const PAYMENT_OPTIONS = [
  { value: 'ALL', label: 'Усі способи' },
  { value: 'CASH', label: 'Готівка' },
  { value: 'CARD', label: 'Картка' },
  { value: 'MANUAL', label: 'Вручну' },
]

const DATE_OPTIONS = [
  { value: 'ALL', label: 'Усі дати' },
  { value: 'TODAY', label: 'Сьогодні' },
  { value: 'YESTERDAY', label: 'Вчора' },
]

const OrdersFilter = ({
  stores, search, storeId, state, payment, datePreset,
  onSearch, onStore, onState, onPayment, onDatePreset,
}: IOrdersFilterProps) => (
  <div className="bg-card rounded-xl border border-border p-4 flex flex-col lg:flex-row gap-3">
    <div className="relative flex-1">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Пошук за №, касиром, магазином..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        className="pl-9"
      />
    </div>

    <Select value={storeId} onValueChange={onStore}>
      <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="Магазин" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Усі магазини</SelectItem>
        {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
      </SelectContent>
    </Select>

    <Select value={state} onValueChange={onState}>
      <SelectTrigger className="w-full lg:w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        {STATE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>

    <Select value={payment} onValueChange={onPayment}>
      <SelectTrigger className="w-full lg:w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        {PAYMENT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>

    <Select value={datePreset} onValueChange={onDatePreset}>
      <SelectTrigger className="w-full lg:w-36"><SelectValue /></SelectTrigger>
      <SelectContent>
        {DATE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>

  </div>
)

export { OrdersFilter }
