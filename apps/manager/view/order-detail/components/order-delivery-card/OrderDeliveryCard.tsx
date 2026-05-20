import { Card, CardContent, CardHeader } from '@pkg/ui'
import type { IOrderDeliveryCardProps } from './types'

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  NONE:             'Не вказано',
  PREPARING:        'Готується',
  OUT_FOR_DELIVERY: 'У дорозі',
  DELIVERED:        'Доставлено',
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm text-foreground text-right">{value}</span>
  </div>
)

const OrderDeliveryCard = ({ deliveryAddress, deliveryStatus }: IOrderDeliveryCardProps) => {
  const addr = deliveryAddress as { street?: string; city?: string; zip?: string } | null
  const addressLine = addr
    ? [addr.street, addr.city, addr.zip].filter(Boolean).join(', ')
    : '—'

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-foreground">Доставка</h3>
      </CardHeader>
      <CardContent className="pt-0">
        <Row label="Адреса" value={addressLine} />
        <Row label="Статус" value={DELIVERY_STATUS_LABEL[deliveryStatus] ?? deliveryStatus} />
      </CardContent>
    </Card>
  )
}

export { OrderDeliveryCard }
