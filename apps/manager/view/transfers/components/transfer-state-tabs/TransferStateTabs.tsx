'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@pkg/ui/cn'
import type { ITransferStateTabsProps, TStateTab } from './types'

const TABS: { label: string; value: TStateTab }[] = [
  { label: 'Усі',         value: 'ALL' },
  { label: 'Чернетки',    value: 'DRAFT' },
  { label: 'У дорозі',    value: 'IN_TRANSIT' },
  { label: 'Завершені',   value: 'COMPLETED' },
  { label: 'Скасовані',   value: 'CANCELLED' },
]

const TransferStateTabs = ({ active }: ITransferStateTabsProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleClick = (next: TStateTab) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'ALL') params.delete('state')
    else params.set('state', next)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex gap-1 border-b border-slate-200 dark:border-border">
      {TABS.map(t => (
        <button
          key={t.value}
          onClick={() => handleClick(t.value)}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            active === t.value
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export { TransferStateTabs }
