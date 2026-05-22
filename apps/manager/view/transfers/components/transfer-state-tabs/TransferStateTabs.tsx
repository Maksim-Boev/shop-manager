'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@pkg/ui'
import type { ITransferStateTabsProps, TStateTab } from './types'

const TABS: { label: string; value: TStateTab }[] = [
  { label: 'Усі',       value: 'ALL' },
  { label: 'Чернетки',  value: 'DRAFT' },
  { label: 'У дорозі',  value: 'IN_TRANSIT' },
  { label: 'Завершені', value: 'COMPLETED' },
  { label: 'Скасовані', value: 'CANCELLED' },
]

const TransferStateTabs = ({ active }: ITransferStateTabsProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (next: string) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'ALL') params.delete('state')
    else params.set('state', next)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Tabs value={active} onValueChange={handleChange}>
      <TabsList variant="line">
        {TABS.map(t => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export { TransferStateTabs }
