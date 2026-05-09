import { ReceiptIcon } from 'lucide-react'
import {
  Card, CardContent, Badge,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { ISalaryHistoryProps } from './types'

const MONTH_NAMES = [
  '', 'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
]

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
  PAID:      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:   'Очікує',
  PAID:      'Виплачено',
  CANCELLED: 'Скасовано',
}

const fmtUAH = (n: number) =>
  `₴ ${n.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const SalaryHistory = ({ payouts }: ISalaryHistoryProps) => (
  <Card>
    <CardContent className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-muted-foreground uppercase font-bold tracking-wide">
        <ReceiptIcon className="size-3.5" />
        Виплати
      </div>

      {payouts.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400 dark:text-muted-foreground">
          Виплат ще не було
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Місяць</TableHead>
              <TableHead className="text-right">Сума</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата виплати</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium text-slate-900 dark:text-foreground">
                  {MONTH_NAMES[p.periodMonth]} {p.periodYear}
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-slate-900 dark:text-foreground">
                  {fmtUAH(p.totalAmount)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(STATUS_BADGE[p.status])}>
                    {STATUS_LABEL[p.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-500 dark:text-muted-foreground">
                  {p.paidAt ? p.paidAt.toLocaleDateString('uk-UA') : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
)

export { SalaryHistory }
