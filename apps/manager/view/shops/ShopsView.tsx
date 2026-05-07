'use client'

import { useState, useMemo } from 'react'
import { Button } from '@pkg/ui'
import { getShopOpenStatus } from '@pkg/db/utils/shop-status'
import { ShopsFilter } from './components/shops-filter'
import { ShopsGrid } from './components/shops-grid'
import { ShopsTable } from './components/shops-table'
import { AddShopModal } from './components/add-shop-modal'
import type { IShopsViewProps, TViewMode, TStatusFilter } from './types'

const ShopsView = ({ shops, userRole }: IShopsViewProps) => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>('ALL')
  const [viewMode, setViewMode] = useState<TViewMode>('grid')
  const [addModalOpen, setAddModalOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return shops.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(q) ||
        (s.address?.toLowerCase().includes(q) ?? false)
      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'OPEN_NOW'
            ? s.status === 'ACTIVE' &&
              getShopOpenStatus(s.weeklySchedule, s.scheduleExceptions) === 'open'
            : s.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [shops, search, statusFilter])

  const canAddShop = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-foreground tracking-tight">Магазини</h1>
          <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">{shops.length} магазинів у мережі</p>
        </div>
        {canAddShop && (
          <>
            <Button onClick={() => setAddModalOpen(true)}>
              Додати магазин
            </Button>
            <AddShopModal open={addModalOpen} onOpenChange={setAddModalOpen} />
          </>
        )}
      </div>

      <ShopsFilter
        search={search}
        onSearch={setSearch}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        viewMode={viewMode}
        onViewMode={setViewMode}
      />

      {viewMode === 'grid'
        ? <ShopsGrid shops={filtered} />
        : <ShopsTable shops={filtered} />}
    </div>
  )
}

export { ShopsView }
