import Link from 'next/link'
import { CreditCardIcon, BanknoteIcon, WrenchIcon, StoreIcon, ChevronRightIcon } from 'lucide-react'
import { Badge, TableCell, TableRow } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { IOrderRowProps } from './types'

const ACCENT_KEYS = ['indigo', 'emerald', 'amber', 'sky', 'violet', 'teal'] as const
const ACCENT_BG: Record<string, string> = {
  indigo:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  amber:   'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  sky:     'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  violet:  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  teal:    'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
}

const getAccentClass = (id: string) => {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return ACCENT_BG[ACCENT_KEYS[hash % ACCENT_KEYS.length]]
}

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

const PayIcon = ({ method }: { method: string | null }) => {
  if (method === 'CARD') return <CreditCardIcon className="size-3.5 shrink-0" />
  if (method === 'CASH') return <BanknoteIcon className="size-3.5 shrink-0" />
  return <WrenchIcon className="size-3.5 shrink-0" />
}

const PAYMENT_LABEL: Record<string, string> = { CASH: 'Готівка', CARD: 'Картка', MANUAL: 'Вручну' }

const fmt = (n: number) =>
  n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const getInitials = (name: string) =>
  name.split(' ').map(p => p[0] ?? '').join('').toUpperCase().slice(0, 2)

const OrderRow = ({ order }: IOrderRowProps) => {
  const accentClass = getAccentClass(order.storeId)
  const initials = getInitials(order.cashierName)

  return (
    <TableRow className={cn('hover:bg-muted/40 cursor-pointer group', order.state === 'CANCELLED' && 'opacity-60')}>
      <TableCell>
        <Link href={`/orders/${order.id}`} className="block">
          <div className="font-mono text-sm font-semibold text-foreground">#{order.orderNumber}</div>
          <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
            {order.createdAt.toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </Link>
      </TableCell>

      <TableCell>
        <Link href={`/orders/${order.id}`} className="flex items-center gap-2.5">
          <div className={cn('size-7 rounded-md flex items-center justify-center shrink-0', accentClass)}>
            <StoreIcon className="size-3.5" />
          </div>
          <span className="text-sm font-medium text-foreground truncate max-w-[160px]">{order.storeName}</span>
        </Link>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">
            {initials}
          </div>
          <span className="text-sm text-foreground truncate max-w-[120px]">{order.cashierName}</span>
        </div>
      </TableCell>

      <TableCell className="text-center tabular-nums text-sm text-foreground">{order.itemCount}</TableCell>

      <TableCell>
        {order.paymentMethod ? (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <PayIcon method={order.paymentMethod} />
            <span className="text-sm">{PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</span>
          </div>
        ) : <span className="text-muted-foreground">—</span>}
      </TableCell>

      <TableCell className="text-right">
        <div className="font-bold text-foreground tabular-nums">{fmt(order.grandTotal)} грн.</div>
      </TableCell>

      <TableCell className="text-center">
        <Badge variant="outline" className={cn(STATE_BADGE[order.state])}>
          {STATE_LABEL[order.state]}
        </Badge>
      </TableCell>

      <TableCell className="w-8">
        <ChevronRightIcon className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </TableCell>
    </TableRow>
  )
}

export { OrderRow }
