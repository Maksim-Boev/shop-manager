'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LockIcon, UnlockIcon } from 'lucide-react'
import { Avatar, AvatarFallback, Badge, Button } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { setUserStatus } from '@/actions/staff'
import type { IStaffRowProps } from './types'

const ROLE_LABEL: Record<string, string> = {
  ADMIN:       'Адміністратор',
  MANAGER:     'Менеджер',
  CASHIER:     'Касир',
  SALESPERSON: 'Продавець',
}

const ACCENT_COLORS = ['indigo', 'emerald', 'amber', 'sky', 'violet', 'teal'] as const
type TAccent = typeof ACCENT_COLORS[number]

const getAccent = (id: string): TAccent => {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return ACCENT_COLORS[sum % ACCENT_COLORS.length]
}

const AVATAR_CLASSES: Record<TAccent, string> = {
  indigo:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  amber:   'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  sky:     'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  violet:  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  teal:    'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
}

const StaffRow = ({ member, actorRole, actorId }: IStaffRowProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const isSelf = member.id === actorId
  const canManage =
    (actorRole === 'ADMIN' && member.role !== 'ADMIN') ||
    actorRole === 'SUPER_ADMIN'
  const showStatusButton = canManage && !isSelf && member.role !== 'SUPER_ADMIN'

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    const next = member.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
    startTransition(async () => {
      try {
        await setUserStatus({ userId: member.id, status: next })
        router.refresh()
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Помилка')
      }
    })
  }

  const initials = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase()
  const isBlocked = member.status === 'BLOCKED'
  const accent = getAccent(member.id)
  const stores = member.managedStores
  const primaryNames = stores.slice(0, 2).map(s => s.name).join(', ')
  const moreCount = Math.max(0, stores.length - 2)

  const fmt = (d: Date | string) =>
    new Date(d).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })

  const shiftLabel = member.scheduledShiftToday
    ? `${fmt(member.scheduledShiftToday.startsAt)} – ${fmt(member.scheduledShiftToday.endsAt)}`
    : member.hasOpenShift && member.openShiftStart
      ? `з ${fmt(member.openShiftStart)}`
      : '—'

  return (
    <Link
      href={`/staff/${member.id}`}
      className={cn(
        'block bg-card border border-border rounded-xl p-4 relative',
        'hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors',
        isBlocked && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <Avatar className="size-12">
            <AvatarFallback className={cn('text-sm font-bold', AVATAR_CLASSES[accent])}>
              {initials}
            </AvatarFallback>
          </Avatar>
          {member.hasOpenShift && (
            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 border-2 border-card" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold text-slate-900 dark:text-foreground truncate">
            {member.firstName} {member.lastName}
            {isSelf && (
              <span className="text-xs text-slate-400 dark:text-muted-foreground font-normal ml-1.5">(ви)</span>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
            {ROLE_LABEL[member.role] ?? member.role}
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {member.hasOpenShift ? (
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                На зміні
              </Badge>
            ) : (
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 dark:border-border dark:bg-muted/40 dark:text-muted-foreground">
                Поза зміною
              </Badge>
            )}
            {isBlocked && (
              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
                Заблокований
              </Badge>
            )}
          </div>
        </div>

        {showStatusButton && (
          <Button
            variant={isBlocked ? 'ghost-success' : 'ghost-destructive'}
            size="icon-sm"
            onClick={handleToggle}
            disabled={pending}
            title={isBlocked ? 'Розблокувати' : 'Заблокувати'}
            className="shrink-0"
          >
            {isBlocked ? <UnlockIcon className="size-4" /> : <LockIcon className="size-4" />}
          </Button>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-border flex items-center justify-between text-xs">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 dark:text-muted-foreground uppercase font-bold tracking-wide">Магазини</div>
          <div
            className="text-slate-900 dark:text-foreground font-semibold mt-0.5 truncate max-w-[180px]"
            title={stores.map(s => s.name).join(', ') || 'Не призначено'}
          >
            {stores.length === 0 ? (
              <span className="text-rose-600 dark:text-rose-300">Не призначено</span>
            ) : (
              <>
                {primaryNames}
                {moreCount > 0 && (
                  <span className="text-slate-400 dark:text-muted-foreground font-normal"> +{moreCount}</span>
                )}
              </>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 dark:text-muted-foreground uppercase font-bold tracking-wide">Зміна</div>
          <div className="text-slate-900 dark:text-foreground font-semibold mt-0.5 tabular-nums">{shiftLabel}</div>
        </div>
      </div>
    </Link>
  )
}

export { StaffRow }
