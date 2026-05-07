import { Card, CardContent } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { IRevenueChartProps } from './types'

const RevenueChart = ({ data, totalRevenue }: IRevenueChartProps) => {
  const values = data.map(d => Number(d.revenue))
  const max = Math.max(...values, 1)

  return (
    <Card className="lg:col-span-2">
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-foreground">Виручка по годинах</h2>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">Сьогодні, сумарно по всій мережі</p>
          </div>
        </div>
        <div className="mb-5">
          <div className="text-3xl font-bold text-slate-900 dark:text-foreground tabular-nums">{totalRevenue}</div>
        </div>
        <div className="flex items-end gap-1 h-[180px]">
          {data.map((d, i) => {
            const h = (Number(d.revenue) / max) * 160
            const isPeak = Number(d.revenue) === max
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className={cn(
                    'w-full rounded-t transition-all group-hover:opacity-80',
                    isPeak
                      ? 'bg-indigo-600 dark:bg-indigo-400'
                      : 'bg-indigo-200 dark:bg-indigo-500/30',
                  )}
                  style={{ height: Math.max(h, 2), minHeight: 2 }}
                />
                {i % 2 === 0 && (
                  <div className="text-[10px] text-slate-400 dark:text-muted-foreground">{String(d.hour).padStart(2, '0')}</div>
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
