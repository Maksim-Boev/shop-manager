import { ShoppingCartIcon, UserCheckIcon, TruckIcon } from 'lucide-react'
import { Card, CardContent } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import type { IActivityFeedProps } from './types'

const EVENT_META = {
  SALE:       { icon: ShoppingCartIcon, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  SHIFT_OPEN: { icon: UserCheckIcon,    color: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
  TRANSFER:   { icon: TruckIcon,        color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300' },
}

const ActivityFeed = ({ events }: IActivityFeedProps) => (
  <Card>
    <CardContent>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-foreground">Стрічка подій</h2>
          <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">На момент завантаження</p>
        </div>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-muted-foreground">Подій немає</p>
      ) : (
        <div className="space-y-0 -mx-2">
          {events.map((e, i) => {
            const meta = EVENT_META[e.type]
            const time = e.occurredAt.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={e.id} className="relative flex gap-3 items-start px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-muted/40">
                {i < events.length - 1 && (
                  <div className="absolute left-5.5 top-10 bottom-0 w-px bg-slate-100 dark:bg-border" />
                )}
                <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0 relative z-10', meta.color)}>
                  <meta.icon className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-sm text-slate-900 dark:text-foreground leading-snug">{e.text}</div>
                  <div className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <span>{e.storeName}</span>
                    <span className="text-slate-300 dark:text-muted-foreground/50">·</span>
                    <span className="tabular-nums">{time}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </CardContent>
  </Card>
)

export { ActivityFeed }
