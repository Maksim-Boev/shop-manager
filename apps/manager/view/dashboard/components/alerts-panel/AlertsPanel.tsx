import { AlertTriangleIcon, PackageIcon, ClockIcon } from 'lucide-react'
import { Card, CardContent } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { IAlertsProps } from './types'

const ALERT_META = {
  NO_MANAGER:           { icon: AlertTriangleIcon, color: 'bg-rose-50 text-rose-600' },
  OUT_OF_STOCK:         { icon: PackageIcon,       color: 'bg-amber-50 text-amber-600' },
  STALE_DRAFT_TRANSFER: { icon: ClockIcon,         color: 'bg-sky-50 text-sky-600' },
}

const AlertsPanel = ({ alerts }: IAlertsProps) => (
  <Card>
    <CardContent>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Потребують уваги</h2>
          <p className="text-xs text-slate-500 mt-0.5">{alerts.length} задач</p>
        </div>
      </div>
      {alerts.length === 0 ? (
        <p className="text-sm text-slate-400">Все гаразд</p>
      ) : (
        <div className="divide-y divide-slate-100 -mx-4">
          {alerts.map((a, i) => {
            const meta = ALERT_META[a.type]
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/60">
                <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', meta.color)}>
                  <meta.icon className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{a.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </CardContent>
  </Card>
)

export { AlertsPanel }
