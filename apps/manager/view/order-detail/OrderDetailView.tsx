import { Badge } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { CreditCardIcon, BanknoteIcon, WrenchIcon } from 'lucide-react'
import { OrderBreadcrumb } from './components/order-breadcrumb'
import { OrderHeaderCard } from './components/order-header-card'
import { OrderSummaryCard } from './components/order-summary-card'
import { OrderItemsTable } from './components/order-items-table'
import { OrderCashierCard } from './components/order-cashier-card'
import { OrderActionsCard } from './components/order-actions-card'
import { OrderTimelineCard } from './components/order-timeline-card'
import { OrderRelatedCard } from './components/order-related-card'
import type { IOrderDetailViewProps } from './types'

const ACCENT_KEYS = ['indigo', 'emerald', 'amber', 'sky', 'violet', 'teal'] as const
const ACCENT_MAP: Record<string, { bg: string; fg: string }> = {
  indigo:  { bg: '#EEF2FF', fg: '#4338CA' },
  emerald: { bg: '#ECFDF5', fg: '#047857' },
  amber:   { bg: '#FFFBEB', fg: '#B45309' },
  sky:     { bg: '#F0F9FF', fg: '#0369A1' },
  violet:  { bg: '#F5F3FF', fg: '#6D28D9' },
  teal:    { bg: '#F0FDFA', fg: '#0F766E' },
}

const getAccent = (id: string) => {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return ACCENT_MAP[ACCENT_KEYS[hash % ACCENT_KEYS.length]]
}

const STATE_LABEL: Record<string, string> = {
  DRAFT: 'Чернетка', PENDING: 'Очікує', PAID: 'Оплачено',
  FULFILLED: 'Виконано', CANCELLED: 'Скасовано', REFUNDED: 'Повернено',
}

const PAYMENT_LABEL: Record<string, string> = { CASH: 'Готівка', CARD: 'Картка', MANUAL: 'Вручну' }

const PayChip = ({ method }: { method: string }) => {
  const icon = method === 'CARD'
    ? <CreditCardIcon className="size-3" />
    : method === 'CASH'
      ? <BanknoteIcon className="size-3" />
      : <WrenchIcon className="size-3" />
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      {icon} {PAYMENT_LABEL[method] ?? method}
    </span>
  )
}

const fmtDateTime = (d: Date) =>
  d.toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const STATE_BADGE: Record<string, string> = {
  DRAFT:     'border-slate-200 bg-slate-100 text-slate-600 dark:border-border dark:bg-muted/40 dark:text-muted-foreground',
  PENDING:   'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
  PAID:      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
  FULFILLED: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300',
  REFUNDED:  'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300',
}

const OrderDetailView = ({ order, relatedOrders, cashierStats }: IOrderDetailViewProps) => {
  const accent = getAccent(order.store.id)
  const cashierFullName = `${order.cashier.firstName} ${order.cashier.lastName}`
  const isPaid = order.state === 'PAID' || order.state === 'FULFILLED'

  return (
    <div className="flex flex-col gap-6">
      <OrderBreadcrumb orderNumber={order.orderNumber} orderId={order.id} />

      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-foreground">
          #{order.orderNumber} — {order.store.name}
        </h1>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge variant="outline" className={cn(STATE_BADGE[order.state])}>
            {STATE_LABEL[order.state]}
          </Badge>
          <span className="text-xs text-muted-foreground tabular-nums">{fmtDateTime(order.createdAt)}</span>
          {order.paymentMethod && <PayChip method={order.paymentMethod} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — 2/3: items + related */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <OrderItemsTable
            items={order.items}
            subtotal={order.subtotal}
            discountTotal={order.discountTotal}
            taxTotal={order.taxTotal}
            grandTotal={order.grandTotal}
            pointsRedeemed={order.pointsRedeemed}
            pointsEarned={order.pointsEarned}
          />
          <OrderRelatedCard
            orders={relatedOrders}
            storeName={order.store.name}
            currentDate={order.createdAt}
          />
        </div>

        {/* Right sidebar — 1/3 */}
        <div className="flex flex-col gap-3">
          <OrderHeaderCard order={order} accentBg={accent.bg} accentFg={accent.fg} />
          <OrderSummaryCard
            storeId={order.store.id}
            storeName={order.store.name}
            storeAddress={order.store.address}
            accentBg={accent.bg}
            accentFg={accent.fg}
          />
          <OrderCashierCard
            cashierId={order.cashier.id}
            cashierName={cashierFullName}
            orderCount={cashierStats.orderCount}
            revenue={cashierStats.revenue}
          />
          <OrderActionsCard isPaid={isPaid} />
          <OrderTimelineCard
            createdAt={order.createdAt}
            paidAt={order.paidAt}
            cashierName={cashierFullName}
            storeName={order.store.name}
            state={order.state}
          />
        </div>
      </div>
    </div>
  )
}

export { OrderDetailView }
