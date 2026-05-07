import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
import { Card, CardContent, Badge } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { IKpiCardProps } from './types'

const KpiCard = ({ label, value, sub, delta, alert, icon: Icon, iconBg }: IKpiCardProps) => (
  <Card>
    <CardContent className="pt-2">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={cn('size-9 rounded-xl flex items-center justify-center relative', iconBg)}>
          <Icon className="size-4" />
          {alert && (
            <span className="absolute -top-0.5 -right-0.5 size-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-card animate-pulse" />
          )}
        </div>
        {delta != null && (
          <Badge
            variant="outline"
            className={cn(
              'gap-0.5',
              delta >= 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300',
            )}
          >
            {delta >= 0
              ? <TrendingUpIcon className="size-3" />
              : <TrendingDownIcon className="size-3" />}
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
          </Badge>
        )}
      </div>
      <div className="text-xs font-medium text-slate-500 dark:text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-slate-900 dark:text-foreground mt-1 tabular-nums tracking-tight">{value}</div>
      {sub && <div className="text-xs text-slate-500 dark:text-muted-foreground mt-1">{sub}</div>}
    </CardContent>
  </Card>
)

export { KpiCard }
