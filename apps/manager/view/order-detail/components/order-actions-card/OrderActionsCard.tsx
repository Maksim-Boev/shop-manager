import { PrinterIcon, CopyIcon, MailIcon, FileTextIcon, FlagIcon, RotateCcwIcon, ChevronRightIcon } from 'lucide-react'
import { Card, CardContent } from '@pkg/ui'
import type { IOrderActionsCardProps } from './types'

const Action = ({ icon: Icon, label, danger }: { icon: React.ElementType; label: string; danger?: boolean }) => (
  <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-muted/60 text-left group ${danger ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10' : 'text-foreground'}`}>
    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${danger ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-indigo-50 dark:bg-indigo-500/15'}`}>
      <Icon className={`size-4 ${danger ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-300'}`} />
    </div>
    <span className="flex-1">{label}</span>
    <ChevronRightIcon className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
  </button>
)

const OrderActionsCard = ({ isPaid }: IOrderActionsCardProps) => (
  <Card>
    <CardContent className="p-2">
      <Action icon={PrinterIcon} label="Передрукувати чек" />
      <Action icon={CopyIcon} label="Копіювати дані чека" />
      <Action icon={MailIcon} label="Надіслати на email клієнта" />
      <Action icon={FileTextIcon} label="Акт повернення" />
      <Action icon={FlagIcon} label="Поскаржитися / відмітити" />
      {isPaid && <Action icon={RotateCcwIcon} label="Оформити повернення" danger />}
    </CardContent>
  </Card>
)

export { OrderActionsCard }
