import Link from 'next/link'
import { Card, CardContent } from '@pkg/ui'
import type { IOrderCashierCardProps } from './types'

const fmt = (n: number) =>
  n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const getInitials = (name: string) =>
  name.split(' ').map(p => p[0] ?? '').join('').toUpperCase().slice(0, 2)

const OrderCashierCard = ({ cashierId, cashierName, orderCount, revenue }: IOrderCashierCardProps) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 flex items-center justify-center text-sm font-bold shrink-0">
          {getInitials(cashierName)}
        </div>
        <div className="min-w-0">
          <Link
            href={`/staff/${cashierId}`}
            className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate block"
          >
            {cashierName}
          </Link>
          <div className="text-xs text-muted-foreground">Касир</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Чеків сьогодні</div>
          <div className="text-sm font-bold text-foreground mt-0.5 tabular-nums">{orderCount}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Виручка</div>
          <div className="text-sm font-bold text-foreground mt-0.5 tabular-nums">{fmt(revenue)} грн.</div>
        </div>
      </div>
    </CardContent>
  </Card>
)

export { OrderCashierCard }
