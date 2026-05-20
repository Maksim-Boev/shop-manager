import Link from 'next/link'
import { ReceiptIcon, ChevronRightIcon } from 'lucide-react'
import { Badge } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { IOrderRelatedCardProps } from './types'

const STATE_BADGE: Record<string, string> = {
  DRAFT:     'border-slate-200 bg-slate-100 text-slate-600 dark:border-border dark:bg-muted/40 dark:text-muted-foreground',
  PENDING:   'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
  PAID:      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
  FULFILLED: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300',
  REFUNDED:  'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300',
}
const STATE_LABEL: Record<string, string> = {
  DRAFT: 'Чернетка', PENDING: 'Очікує', PAID: 'Оплачено',
  FULFILLED: 'Виконано', CANCELLED: 'Скасовано', REFUNDED: 'Повернено',
}

const fmt = (n: number) =>
  n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtTime = (d: Date) =>
  d.toLocaleString('uk-UA', { hour: '2-digit', minute: '2-digit' })

const OrderRelatedCard = ({ orders, storeName, currentDate }: IOrderRelatedCardProps) => (
  <div className="rounded-xl border border-border bg-card overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <div>
        <h2 className="font-bold text-foreground">Інші чеки цього магазину</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {currentDate.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })} · {storeName}
        </p>
      </div>
      <Link href="/orders" className="text-xs text-primary hover:underline">Усі продажі →</Link>
    </div>

    {orders.length === 0 ? (
      <div className="px-5 py-8 text-center text-sm text-muted-foreground">
        Немає інших чеків за цей день
      </div>
    ) : (
      <div className="divide-y divide-border">
        {orders.map(o => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 group transition-colors"
          >
            <div className="size-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
              <ReceiptIcon className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-mono text-foreground font-semibold">#{o.orderNumber}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {fmtTime(o.createdAt)} · {o.cashierName} · {o.itemCount} поз.
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-foreground tabular-nums">{fmt(o.grandTotal)} грн.</div>
              <Badge variant="outline" className={cn('mt-0.5', STATE_BADGE[o.state])}>
                {STATE_LABEL[o.state]}
              </Badge>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    )}
  </div>
)

export { OrderRelatedCard }
