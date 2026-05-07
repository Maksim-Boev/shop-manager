'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlusIcon } from 'lucide-react'
import { Button } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { removeManager } from '@/actions/shop'
import { AssignManagerDialog } from './AssignManagerDialog'
import type { IStaffTabProps } from './types'

const ROLE_LABELS: Record<string, string> = {
  MANAGER: 'Менеджер',
  ADMIN: 'Адміністратор',
  CASHIER: 'Касир',
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

const StaffTab = ({ members, availableUsers, shopId, userRole }: IStaffTabProps) => {
  const router = useRouter()
  const [assignOpen, setAssignOpen] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const canManage = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  const handleRemove = (userId: string) => {
    setRemovingId(userId)
    startTransition(async () => {
      try {
        await removeManager(shopId, userId)
        router.refresh()
      } finally {
        setRemovingId(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      {members.length === 0 ? (
        <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border p-12 flex flex-col items-center justify-center text-slate-400 dark:text-muted-foreground">
          <UserPlusIcon className="size-10 mb-3" />
          <p className="text-sm font-medium">Менеджерів не призначено</p>
          {canManage && (
            <Button
              className="mt-4"
              onClick={() => setAssignOpen(true)}
            >
              Призначити менеджера
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(m => (
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
                      variant="ghost"
                      size="sm"
                      disabled={removingId === m.userId}
                      onClick={() => handleRemove(m.userId)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10 text-xs"
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
              onClick={() => setAssignOpen(true)}
              className="w-full border border-dashed border-slate-300 rounded-xl py-3 text-sm font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 dark:border-border dark:text-muted-foreground dark:hover:border-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-500/5 flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlusIcon className="size-4" />
              Призначити менеджера
            </button>
          )}
        </>
      )}

      <AssignManagerDialog
        shopId={shopId}
        availableUsers={availableUsers}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />
    </div>
  )
}

export { StaffTab }
