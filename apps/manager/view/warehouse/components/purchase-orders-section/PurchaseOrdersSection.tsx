import {
  Card, CardContent, Badge,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@pkg/ui'
import type { IPurchaseOrdersSectionProps } from './types'

const STATE_LABEL: Record<string, string> = {
  PLACED:              'Розміщене',
  PARTIALLY_RECEIVED:  'Частково отримане',
}

const PurchaseOrdersSection = ({ orders }: IPurchaseOrdersSectionProps) => (
  <Card>
    <CardContent>
      <h3 className="text-base font-bold text-slate-900 dark:text-foreground mb-4">
        Очікувані поставки
      </h3>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-muted-foreground">
          Немає очікуваних поставок
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Постачальник</TableHead>
              <TableHead>Склад</TableHead>
              <TableHead className="text-right">Позицій</TableHead>
              <TableHead>Розміщене</TableHead>
              <TableHead>Стан</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(o => (
              <TableRow key={o.id}>
                <TableCell className="text-sm text-slate-700 dark:text-foreground">
                  {o.supplierName ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-slate-700 dark:text-foreground">
                  {o.destinationStoreName}
                </TableCell>
                <TableCell className="text-right tabular-nums">{o.itemsCount}</TableCell>
                <TableCell className="text-sm text-slate-500 dark:text-muted-foreground">
                  {o.placedAt ? o.placedAt.toLocaleDateString('uk-UA') : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {STATE_LABEL[o.state] ?? o.state}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
)

export { PurchaseOrdersSection }
