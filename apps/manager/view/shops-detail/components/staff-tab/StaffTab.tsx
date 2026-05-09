'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlusIcon } from 'lucide-react'
import { Button } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { removeStaffFromShop } from '@/actions/shop'
import { AssignStaffDialog } from './AssignStaffDialog'
import { ScheduleGrid } from './schedule-grid'
import type { IStaffTabProps, TAssignableRole } from './types'

const SECTION_TITLES: Record<TAssignableRole, { title: string; subtitle: string; empty: string; assign: string }> = {
  MANAGER: {
    title: 'Менеджери магазину',
    subtitle: 'Закріплені керуючі',
    empty: 'Менеджерів не призначено',
    assign: 'Призначити менеджера',
  },
  CASHIER: {
    title: 'Касири магазину',
    subtitle: 'Працюють за касою',
    empty: 'Касирів не призначено',
    assign: 'Призначити касира',
  },
  SALESPERSON: {
    title: 'Продавці магазину',
    subtitle: 'Робота в торговому залі',
    empty: 'Продавців не призначено',
    assign: 'Призначити продавця',
  },
}

const ROLE_LABELS: Record<string, string> = {
  MANAGER: 'Менеджер',
  ADMIN: 'Адміністратор',
  CASHIER: 'Касир',
  SALESPERSON: 'Продавець',
}

const ACCENT_KEYS = ['indigo', 'emerald', 'amber', 'sky', 'violet', 'teal'] as const
type TAccent = typeof ACCENT_KEYS[number]

const ACCENT_BG: Record<TAccent, string> = {
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
}

const getAccentClass = (id: string) => {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return ACCENT_BG[ACCENT_KEYS[hash % ACCENT_KEYS.length]]
}

const StaffTab = ({
  members, availableUsers, scheduledShifts, storeUsers, weekStartIso,
  shopId, userRole,
}: IStaffTabProps) => {
  const router = useRouter()
  const [assignRole, setAssignRole] = useState<TAssignableRole | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const canManage = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const canSchedule = canManage || userRole === 'MANAGER'

  const groupedMembers = {
    MANAGER: members.filter(m => m.role === 'MANAGER' || m.role === 'ADMIN'),
    CASHIER: members.filter(m => m.role === 'CASHIER'),
    SALESPERSON: members.filter(m => m.role === 'SALESPERSON'),
  }

  const handleRemove = (userId: string) => {
    setRemovingId(userId)
    startTransition(async () => {
      try {
        await removeStaffFromShop(shopId, userId)
        router.refresh()
      } finally {
        setRemovingId(null)
      }
    })
  }

  const renderSection = (role: TAssignableRole) => {
    const section = SECTION_TITLES[role]
    const list = groupedMembers[role]

    return (
      <div key={role} className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-700 dark:text-foreground/90 uppercase tracking-wide">
            {section.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
            {section.subtitle}
          </p>
        </div>
        {list.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border p-8 flex flex-col items-center justify-center text-slate-400 dark:text-muted-foreground">
            <UserPlusIcon className="size-8 mb-2" />
            <p className="text-sm font-medium">{section.empty}</p>
            {canManage && (
              <Button className="mt-3" size="sm" onClick={() => setAssignRole(role)}>
                {section.assign}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map(m => (
                <div
                  key={m.userId}
                  className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-11 h-11 rounded-full text-sm font-bold flex items-center justify-center shrink-0',
                        getAccentClass(m.userId),
                      )}
                    >
                      {m.firstName[0]}{m.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-foreground truncate">
                        {m.firstName} {m.lastName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-muted-foreground truncate">{m.email}</div>
                      <div className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                        {ROLE_LABELS[m.role] ?? m.role}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-border">
                    {m.hasOpenShift ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        На зміні
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 dark:bg-muted dark:text-muted-foreground">
                        Поза зміною
                      </span>
                    )}

                    {canManage && (
                      <Button
                        variant="ghost-destructive"
                        size="sm"
                        disabled={removingId === m.userId}
                        onClick={() => handleRemove(m.userId)}
                      >
                        {removingId === m.userId ? 'Знімається…' : 'Зняти'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {canManage && (
              <button
                onClick={() => setAssignRole(role)}
                className="w-full border border-dashed border-slate-300 rounded-xl py-3 text-sm font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 dark:border-border dark:text-muted-foreground dark:hover:border-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-500/5 flex items-center justify-center gap-2 transition-colors"
              >
                <UserPlusIcon className="size-4" />
                {section.assign}
              </button>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ScheduleGrid
        shopId={shopId}
        shifts={scheduledShifts}
        storeUsers={storeUsers}
        weekStartIso={weekStartIso}
        canManage={canSchedule}
        userRole={userRole}
      />

      {(['MANAGER', 'CASHIER', 'SALESPERSON'] as const).map(role => renderSection(role))}

      <AssignStaffDialog
        shopId={shopId}
        availableUsers={availableUsers}
        open={assignRole !== null}
        onOpenChange={v => { if (!v) setAssignRole(null) }}
        targetRole={assignRole ?? 'MANAGER'}
      />
    </div>
  )
}

export { StaffTab }
