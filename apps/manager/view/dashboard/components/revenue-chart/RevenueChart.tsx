import { Card, CardContent } from '@pkg/ui'
import type { IRevenueChartProps } from './types'

const RevenueChart = ({ data, totalRevenue }: IRevenueChartProps) => {
  const values = data.map(d => Number(d.revenue))
  const max = Math.max(...values, 1)

  return (
    <Card className="lg:col-span-2">
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Виручка по годинах</h2>
            <p className="text-xs text-slate-500 mt-0.5">Сьогодні, сумарно по всій мережі</p>
          </div>
        </div>
        <div className="mb-5">
          <div className="text-3xl font-bold text-slate-900 tabular-nums">{totalRevenue}</div>
        </div>
        <div className="flex items-end gap-1" style={{ height: 180 }}>
          {data.map((d, i) => {
            const h = (Number(d.revenue) / max) * 160
            const isPeak = Number(d.revenue) === max
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full rounded-t transition-all group-hover:opacity-80"
                  style={{ height: Math.max(h, 2), background: isPeak ? '#4F46E5' : '#C7D2FE', minHeight: 2 }}
                />
                {i % 2 === 0 && (
                  <div className="text-[10px] text-slate-400">{String(d.hour).padStart(2, '0')}</div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export { RevenueChart }
