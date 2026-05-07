'use client'

import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@pkg/ui/cn'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@pkg/ui'
import type { IFinanceTabProps } from './types'
import type { TRange } from '../../types'

const fmtDate = (d: string) => d.slice(5).replace('-', '.')

const fmtMoney = (n: number) =>
  `₴ ${n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const FinanceTab = ({ data, shopId, range }: IFinanceTabProps) => {
  const router = useRouter()

  const setRange = (r: TRange) => {
    router.push(`/shops/${shopId}?tab=finance&range=${r}`)
  }

  const total = data.revenueByDay.reduce((s, d) => s + d.revenue, 0)

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-foreground">
              Виручка за {range === 'week' ? 'тиждень' : 'місяць'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Разом: {fmtMoney(total)}
            </p>
          </div>
          <div className="flex gap-1 bg-slate-100 dark:bg-muted/40 rounded-lg p-1">
            {(['week', 'month'] as TRange[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                  range === r
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-card dark:text-foreground'
                    : 'text-slate-500 hover:text-slate-700 dark:text-muted-foreground dark:hover:text-foreground',
                )}
              >
                {r === 'week' ? 'Тиждень' : 'Місяць'}
              </button>
            ))}
          </div>
        </div>

        {data.revenueByDay.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-slate-400 dark:text-muted-foreground text-sm">
            Немає даних за вибраний період
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data.revenueByDay}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmtDate}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}к` : String(v)
                }
                width={36}
              />
              <Tooltip
                cursor={{ fill: 'var(--muted)' }}
                formatter={(value) => [fmtMoney(Number(value)), 'Виручка']}
                labelFormatter={(label) => fmtDate(String(label))}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                  fontSize: 12,
                  padding: '6px 10px',
                }}
              />
              <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Closed shifts table */}
      <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-border">
          <h2 className="font-bold text-slate-900 dark:text-foreground">Закриті зміни</h2>
          <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">Остання 30 змін</p>
        </div>

        {data.closedShifts.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 dark:text-muted-foreground">
            Закритих змін немає
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/60 dark:bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-auto px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Дата</TableHead>
                <TableHead className="h-auto px-5 py-3 text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Касир</TableHead>
                <TableHead className="h-auto px-5 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Очікувана каса</TableHead>
                <TableHead className="h-auto px-5 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Фактична каса</TableHead>
                <TableHead className="h-auto px-5 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Відхилення</TableHead>
                <TableHead className="h-auto px-5 py-3 text-center text-[10px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Z-звіт</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.closedShifts.map(s => {
                const varianceNegative = s.variance !== null && s.variance < 0
                return (
                  <TableRow key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-muted/40">
                    <TableCell className="px-5 py-3">
                      <div className="text-slate-900 dark:text-foreground font-medium tabular-nums">
                        {new Date(s.openedAt).toLocaleDateString('uk-UA')}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-muted-foreground tabular-nums">
                        {new Date(s.openedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(s.closedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-slate-700 dark:text-foreground/90">
                      {s.cashierFirstName} {s.cashierLastName}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-foreground/90">
                      {s.expectedCash !== null ? fmtMoney(s.expectedCash) : '—'}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right tabular-nums text-slate-900 dark:text-foreground font-medium">
                      {s.closingCash !== null ? fmtMoney(s.closingCash) : '—'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'px-5 py-3 text-right tabular-nums font-semibold',
                        varianceNegative ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-foreground/90',
                      )}
                    >
                      {s.variance !== null
                        ? (s.variance >= 0 ? '+' : '') + fmtMoney(s.variance)
                        : '—'}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-center">
                      {s.hasZReport ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                      ) : (
                        <span className="text-slate-300 dark:text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

export { FinanceTab }
