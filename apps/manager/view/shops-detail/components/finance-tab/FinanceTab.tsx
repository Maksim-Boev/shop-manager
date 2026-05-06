'use client'

import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@pkg/ui/cn'
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Виручка за {range === 'week' ? 'тиждень' : 'місяць'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Разом: {fmtMoney(total)}
            </p>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(['week', 'month'] as TRange[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                  range === r
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {r === 'week' ? 'Тиждень' : 'Місяць'}
              </button>
            ))}
          </div>
        </div>

        {data.revenueByDay.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-slate-400 text-sm">
            Немає даних за вибраний період
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data.revenueByDay}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmtDate}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}к` : String(v)
                }
                width={36}
              />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                formatter={(value) => [fmtMoney(Number(value)), 'Виручка']}
                labelFormatter={(label) => fmtDate(String(label))}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Закриті зміни</h2>
          <p className="text-xs text-slate-500 mt-0.5">Остання 30 змін</p>
        </div>

        {data.closedShifts.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Закритих змін немає
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60">
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Дата</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Касир</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Очікувана каса</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Фактична каса</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Відхилення</th>
                  <th className="px-5 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Z-звіт</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.closedShifts.map(s => {
                  const varianceNegative = s.variance !== null && s.variance < 0
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <div className="text-slate-900 font-medium tabular-nums">
                          {new Date(s.openedAt).toLocaleDateString('uk-UA')}
                        </div>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          {new Date(s.openedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(s.closedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {s.cashierFirstName} {s.cashierLastName}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                        {s.expectedCash !== null ? fmtMoney(s.expectedCash) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-900 font-medium">
                        {s.closingCash !== null ? fmtMoney(s.closingCash) : '—'}
                      </td>
                      <td
                        className={cn(
                          'px-5 py-3 text-right tabular-nums font-semibold',
                          varianceNegative ? 'text-rose-600' : 'text-slate-700',
                        )}
                      >
                        {s.variance !== null
                          ? (s.variance >= 0 ? '+' : '') + fmtMoney(s.variance)
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {s.hasZReport ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export { FinanceTab }
