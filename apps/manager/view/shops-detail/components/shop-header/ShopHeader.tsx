'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MapPinIcon, PhoneIcon,
} from 'lucide-react'
import {
  Button, Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
  Tabs, TabsList, TabsTrigger,
} from '@pkg/ui'
import { getShopOpenStatus } from '@pkg/db/utils/shop-status'
import { archiveShop } from '@/actions/shop'
import { useBreadcrumb } from '@/components/layout/breadcrumb'
import type { IShopHeaderProps } from './types'
import type { TTabKey } from '../../types'

const TAB_LABELS: Record<TTabKey, string> = {
  overview: 'Огляд',
  stock: 'Склад',
  staff: 'Персонал',
  schedule: 'Графік',
  finance: 'Фінанси',
}

const ShopHeader = ({ shop, userRole, activeTab, tabs, onTabChange }: IShopHeaderProps) => {
  const router = useRouter()
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const crumbs = useMemo(
    () => [
      { label: 'Магазини', href: '/shops' },
      { label: shop.name },
    ],
    [shop.name],
  )
  useBreadcrumb(crumbs)

  const canArchive =
    (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && shop.status === 'ACTIVE'

  // Тикающие минуты — пересчитываем open/closed раз в минуту
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  const openStatus = shop.status === 'ARCHIVED'
    ? 'unknown'
    : getShopOpenStatus(shop.weeklySchedule, shop.scheduleExceptions, now)

  const handleArchive = () => {
    startTransition(async () => {
      await archiveShop(shop.id)
      setArchiveOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Title + actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[22px] font-bold text-slate-900 dark:text-foreground tracking-tight">{shop.name}</h1>
            {shop.status === 'ARCHIVED' ? (
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-muted dark:text-muted-foreground">
                Архів
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                Активний
              </span>
            )}
            {openStatus === 'open' && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Відкритий
              </span>
            )}
            {openStatus === 'closed' && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-50 text-slate-600 dark:bg-muted/60 dark:text-muted-foreground">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                Закритий
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            {shop.address && (
              <span className="text-sm text-slate-500 dark:text-muted-foreground flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 shrink-0" />
                {shop.address}
              </span>
            )}
            {shop.phone && (
              <span className="text-sm text-slate-500 dark:text-muted-foreground flex items-center gap-1.5">
                <PhoneIcon className="size-3.5 shrink-0" />
                {shop.phone}
              </span>
            )}
          </div>
        </div>

        {canArchive && (
          <Button variant="default" size="sm" onClick={() => setArchiveOpen(true)}>
            Архівувати
          </Button>
        )}
      </div>

      {/* Tab nav */}
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TTabKey)}>
        <TabsList variant="line">
          {tabs.map(tab => (
            <TabsTrigger key={tab} value={tab}>
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Archive Dialog */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Архівувати магазин?</DialogTitle>
            <DialogDescription>
              Магазин «{shop.name}» буде переведено до архіву. Відновлення доступне в
              Налаштуваннях.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveOpen(false)}
              disabled={isPending}
            >
              Скасувати
            </Button>
            <Button
              variant="destructive-solid"
              onClick={handleArchive}
              disabled={isPending}
            >
              {isPending ? 'Архівується…' : 'Архівувати'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { ShopHeader }
