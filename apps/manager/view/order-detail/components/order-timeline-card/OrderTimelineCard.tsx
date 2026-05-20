import { PlusCircleIcon, CheckCircle2Icon, XCircleIcon, RotateCcwIcon } from 'lucide-react'
import { Card, CardContent } from '@pkg/ui'
import type { IOrderTimelineCardProps } from './types'

const fmtTime = (d: Date) =>
  d.toLocaleString('uk-UA', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })

interface ITimelineItemProps {
  icon: React.ElementType
  iconBg: string
  iconFg: string
  title: string
  desc: string
  time: string
  last?: boolean
}

const TimelineItem = ({ icon: Icon, iconBg, iconFg, title, desc, time, last }: ITimelineItemProps) => (
  <div className="flex gap-3 relative">
    {!last && <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />}
    <div className={`size-7 rounded-full flex items-center justify-center shrink-0 relative z-10 ${iconBg} ${iconFg}`}>
      <Icon className="size-3.5" />
    </div>
    <div className="pb-4 min-w-0">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      <div className="text-[10px] text-muted-foreground/70 mt-0.5 tabular-nums">{time}</div>
    </div>
  </div>
)

const OrderTimelineCard = ({ createdAt, paidAt, cashierName, storeName, state }: IOrderTimelineCardProps) => (
  <Card>
    <CardContent className="p-4">
      <h3 className="text-sm font-bold text-foreground mb-3">Історія чека</h3>
      <TimelineItem
        icon={PlusCircleIcon}
        iconBg="bg-indigo-100 dark:bg-indigo-500/15"
        iconFg="text-indigo-700 dark:text-indigo-300"
        title="Чек створено"
        desc={`${cashierName} · ${storeName}`}
        time={fmtTime(createdAt)}
        last={!paidAt && state !== 'CANCELLED' && state !== 'REFUNDED'}
      />
      {paidAt && state !== 'CANCELLED' && state !== 'REFUNDED' && (
        <TimelineItem
          icon={CheckCircle2Icon}
          iconBg="bg-emerald-100 dark:bg-emerald-500/15"
          iconFg="text-emerald-700 dark:text-emerald-300"
          title="Оплата отримана"
          desc={state === 'FULFILLED' ? 'Виконано' : 'Оплачено'}
          time={fmtTime(paidAt)}
          last
        />
      )}
      {state === 'CANCELLED' && (
        <TimelineItem
          icon={XCircleIcon}
          iconBg="bg-rose-100 dark:bg-rose-500/15"
          iconFg="text-rose-700 dark:text-rose-300"
          title="Чек скасовано"
          desc=""
          time={fmtTime(paidAt ?? createdAt)}
          last
        />
      )}
      {state === 'REFUNDED' && (
        <TimelineItem
          icon={RotateCcwIcon}
          iconBg="bg-violet-100 dark:bg-violet-500/15"
          iconFg="text-violet-700 dark:text-violet-300"
          title="Повернення"
          desc="Повне повернення коштів"
          time={fmtTime(paidAt ?? createdAt)}
          last
        />
      )}
    </CardContent>
  </Card>
)

export { OrderTimelineCard }
