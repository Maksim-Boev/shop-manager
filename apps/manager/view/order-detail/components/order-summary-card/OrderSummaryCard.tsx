import Link from 'next/link'
import { StoreIcon } from 'lucide-react'
import { Button, Card, CardContent } from '@pkg/ui'
import type { IOrderSummaryCardProps } from './types'

const OrderSummaryCard = ({ storeId, storeName, storeAddress, accentBg, accentFg }: IOrderSummaryCardProps) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="size-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: accentBg, color: accentFg }}
        >
          <StoreIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-foreground truncate">{storeName}</div>
          <div className="text-xs text-muted-foreground truncate">{storeAddress ?? '—'}</div>
        </div>
      </div>
      <Button variant="soft-primary" size="sm" className="w-full" asChild>
        <Link href={`/shops/${storeId}`}>Перейти до магазину →</Link>
      </Button>
    </CardContent>
  </Card>
)

export { OrderSummaryCard }
