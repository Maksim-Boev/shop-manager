'use client'

import { useMemo, useState } from 'react'
import { StaffFilter } from './components/staff-filter'
import { StaffTable } from './components/staff-table'
import type { IStaffViewProps, TRoleFilter, TStatusFilter } from './types'

const StaffView = ({ staff, actorRole, actorId, stores }: IStaffViewProps) => {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<TRoleFilter>('ALL')
  const [status, setStatus] = useState<TStatusFilter>('ALL')
  const [storeId, setStoreId] = useState<string>('ALL')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return staff.filter(m => {
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase()
      const matchesSearch =
        fullName.includes(q) || m.email.toLowerCase().includes(q)
      const matchesRole = role === 'ALL' || m.role === role
      const matchesStatus = status === 'ALL' || m.status === status
      const matchesStore =
        storeId === 'ALL' || m.managedStores.some(s => s.id === storeId)
      return matchesSearch && matchesRole && matchesStatus && matchesStore
    })
  }, [staff, search, role, status, storeId])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-foreground tracking-tight">Персонал</h1>
        <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
          {staff.length} користувачів у компанії
        </p>
      </div>

      <StaffFilter
        search={search}      onSearch={setSearch}
        role={role}          onRole={setRole}
        status={status}      onStatus={setStatus}
        storeId={storeId}    onStore={setStoreId}
        stores={stores}
      />

      <StaffTable staff={filtered} actorRole={actorRole} actorId={actorId} />
    </div>
  )
}

export { StaffView }
