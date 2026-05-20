'use client'

import { useMemo, useState } from 'react'
import { UserPlusIcon } from 'lucide-react'
import { Button, Card, CardContent } from '@pkg/ui'
import { StaffFilter } from './components/staff-filter'
import { StaffTable } from './components/staff-table'
import { AddStaffModal } from './components/add-staff-modal'
import type { IStaffViewProps, TRoleFilter, TStatusFilter } from './types'

const StaffView = ({ staff, actorRole, actorId, stores }: IStaffViewProps) => {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<TRoleFilter>('ALL')
  const [status, setStatus] = useState<TStatusFilter>('ALL')
  const [storeId, setStoreId] = useState<string>('ALL')
  const [addOpen, setAddOpen] = useState(false)

  const canCreate = actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN'

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return staff.filter(m => {
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase()
      const matchesSearch =
        fullName.includes(q) || m.email.toLowerCase().includes(q)
      const matchesRole = role === 'ALL' || m.role === role
      const matchesStatus = status === 'ALL' || m.status === status
      const matchesStore =
        storeId === 'ALL' ||
        (storeId === 'UNASSIGNED' && m.managedStores.length === 0) ||
        m.managedStores.some(s => s.id === storeId)
      return matchesSearch && matchesRole && matchesStatus && matchesStore
    })
  }, [staff, search, role, status, storeId])

  const onShiftCount = staff.filter(m => m.hasOpenShift).length

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 dark:text-foreground tracking-tight">
              Персонал
            </h1>
            <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
              {staff.length} людей · {onShiftCount} на зміні
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setAddOpen(true)} className="gap-2 shrink-0">
              <UserPlusIcon className="size-4" />
              Додати співробітника
            </Button>
          )}
        </div>

        <Card className="py-0">
          <CardContent className="p-4">
            <StaffFilter
              search={search}      onSearch={setSearch}
              role={role}          onRole={setRole}
              status={status}      onStatus={setStatus}
              storeId={storeId}    onStore={setStoreId}
              stores={stores}
            />
          </CardContent>
        </Card>

        <StaffTable staff={filtered} actorRole={actorRole} actorId={actorId} />
      </div>

      {canCreate && (
        <AddStaffModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          stores={stores}
        />
      )}
    </>
  )
}

export { StaffView }
