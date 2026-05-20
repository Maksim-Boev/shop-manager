import { ShoppingCartIcon } from 'lucide-react'
import { Table, TableBody, TableHead, TableHeader, TableRow, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pkg/ui'
import { OrderRow } from '../order-row'
import type { IOrdersTableProps } from './types'

const SORT_OPTIONS = [
  { value: 'time-desc', label: 'Спочатку нові' },
  { value: 'time-asc', label: 'Спочатку старі' },
  { value: 'total-desc', label: 'За сумою ↓' },
  { value: 'total-asc', label: 'За сумою ↑' },
]

const fmt = (n: number) =>
  n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const OrdersTable = ({ orders, totalRevenue, totalItems, totalCount, sortBy, onSortBy }: IOrdersTableProps) => (
  <div>
    {/* Summary bar */}
    <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
      <p className="text-xs text-muted-foreground">
        Показано{' '}
        <span className="font-semibold text-foreground">{orders.length}</span> чеків
        {' · '}{totalItems} позицій
        {' · '}
        <span className="font-semibold text-foreground">{fmt(totalRevenue)} грн.</span>
      </p>
      <Select value={sortBy} onValueChange={onSortBy}>
        <SelectTrigger className="w-40 h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>

    {orders.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center">
          <ShoppingCartIcon className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Чеків не знайдено. Спробуйте змінити фільтри.</p>
      </div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20">
            <TableHead className="w-36">Чек</TableHead>
            <TableHead>Магазин</TableHead>
            <TableHead className="w-44">Касир</TableHead>
            <TableHead className="text-center w-20">Позицій</TableHead>
            <TableHead className="w-32">Оплата</TableHead>
            <TableHead className="text-right w-36">Сума</TableHead>
            <TableHead className="text-center w-32">Статус</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(o => <OrderRow key={o.id} order={o} />)}
        </TableBody>
      </Table>
    )}

    {/* Footer */}
    <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/10">
      <span>Показано {orders.length} з {totalCount}</span>
    </div>
  </div>
)

export { OrdersTable }
