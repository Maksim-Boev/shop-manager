import {
  HashIcon, CalendarIcon, CreditCardIcon, BanknoteIcon,
  WrenchIcon, ShoppingCartIcon,
} from 'lucide-react'
import { Card, CardContent } from '@pkg/ui'
import type { IOrderHeaderCardProps } from './types'

const fmt = (n: number) =>
  n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (d: Date) =>
  d.toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const PAYMENT_LABEL: Record<string, string> = { CASH: 'Готівка', CARD: 'Картка', MANUAL: 'Вручну' }
const STATE_LABEL: Record<string, string> = {
  DRAFT: 'Чернетка', PENDING: 'Очікує', PAID: 'Сплачено',
  FULFILLED: 'Виконано', CANCELLED: 'Скасовано', REFUNDED: 'Повернено',
}

const InfoRow = ({ icon, label, value, mono }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
      {icon} {label}
    </div>
    <div className={`text-sm font-semibold text-foreground tabular-nums ${mono ? 'font-mono text-xs' : ''}`}>
      {value}
    </div>
  </div>
)

const PayIconNode = ({ method }: { method: string | null }) => {
  if (method === 'CARD') return <CreditCardIcon className="size-3.5" />
  if (method === 'CASH') return <BanknoteIcon className="size-3.5" />
  return <WrenchIcon className="size-3.5" />
}

const OrderHeaderCard = ({ order, accentFg }: IOrderHeaderCardProps) => (
  <Card className="relative overflow-hidden">
    <div
      className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 pointer-events-none"
      style={{ background: accentFg }}
    />
    <CardContent className="p-4 relative">
      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-foreground tabular-nums tracking-tight">
          {fmt(order.grandTotal)} грн.
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {STATE_LABEL[order.state] ?? order.state}
        </div>
      </div>

      <div className="space-y-2.5 pt-3 border-t border-border">
        <InfoRow icon={<HashIcon className="size-3.5" />} label="Номер чека" value={`#${order.orderNumber}`} mono />
        <InfoRow icon={<CalendarIcon className="size-3.5" />} label="Дата і час" value={fmtDate(order.createdAt)} />
        {order.paymentMethod && (
          <InfoRow
            icon={<PayIconNode method={order.paymentMethod} />}
            label="Спосіб оплати"
            value={PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
          />
        )}
        <InfoRow
          icon={<ShoppingCartIcon className="size-3.5" />}
          label="Позицій / одиниць"
          value={`${order.items.length} / ${order.items.reduce((s, i) => s + i.quantity, 0)}`}
        />
      </div>
    </CardContent>
  </Card>
)

export { OrderHeaderCard }
