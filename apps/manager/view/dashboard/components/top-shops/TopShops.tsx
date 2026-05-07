import Link from 'next/link'
import { ChevronRightIcon, ArrowRightIcon } from 'lucide-react'
import { Card, CardContent, Button } from '@pkg/ui'
import type { ITopShopsProps } from './types'

const COLORS = ['#10B981', '#F59E0B', '#4F46E5', '#8B5CF6', '#EC4899']

const TopShops = ({ shops }: ITopShopsProps) => {
  const maxRevenue = Math.max(...shops.map(s => Number(s.revenueToday)), 1)

  return (
    <Card className="lg:col-span-2">
      <CardContent>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-foreground">Топ магазинів за виручкою</h2>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">Сьогодні</p>
          </div>
          <Button variant="link" size="sm" asChild>
            <Link href="/shops" className="inline-flex items-center gap-1">
              Усі магазини <ArrowRightIcon className="size-3" />
            </Link>
          </Button>
        </div>
        {shops.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-muted-foreground py-4">Немає даних за сьогодні</p>
        ) : (
          <div className="space-y-1">
            {shops.map((s, i) => {
              const pct = (Number(s.revenueToday) / maxRevenue) * 100
              const color = COLORS[i % COLORS.length]
              return (
                <Link
                  key={s.storeId}
                  href={`/shops/${s.storeId}`}
                  className="grid grid-cols-12 items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-muted/40 group transition-colors"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="size-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: color }}>
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 dark:text-foreground truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{s.name}</div>
                      <div className="text-xs text-slate-500 dark:text-muted-foreground">{s.checksCount} чеків</div>
                    </div>
                  </div>
                  <div className="col-span-5">
                    <div className="h-1.5 bg-slate-100 dark:bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: pct + '%', background: color }} />
                    </div>
                  </div>
                  <div className="col-span-2 text-right tabular-nums">
                    <div className="font-bold text-slate-900 dark:text-foreground text-sm">₴ {Number(s.revenueToday).toLocaleString('uk-UA')}</div>
                  </div>
                  <div className="col-span-1 text-right">
                    <ChevronRightIcon className="size-4 text-slate-300 dark:text-muted-foreground/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 ml-auto" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { TopShops }
