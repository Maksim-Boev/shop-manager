'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LockIcon, UnlockIcon } from 'lucide-react'
import {
  Avatar, AvatarFallback, Badge, Button, TableCell, TableRow,
} from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { setUserStatus } from '@/actions/staff'
import type { IStaffRowProps } from './types'

const ROLE_LABEL: Record<string, string> = {
  ADMIN:   'Адміністратор',
  MANAGER: 'Менеджер',
  CASHIER: 'Касир',
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN:   'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300',
  MANAGER: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300',
  CASHIER: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-border dark:bg-muted/40 dark:text-foreground',
}

const StaffRow = ({ member, actorRole, actorId }: IStaffRowProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const isSelf = member.id === actorId
  const canManage =
    (actorRole === 'ADMIN' && member.role !== 'ADMIN') ||
    actorRole === 'SUPER_ADMIN'
  const showStatusButton = canManage && !isSelf && member.role !== 'SUPER_ADMIN'

  const handleToggle = () => {
    const next = member.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
    startTransition(async () => {
      try {
        await setUserStatus({ userId: member.id, status: next })
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Помилка')
      }
    })
  }

  const initials = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase()
  const isBlocked = member.status === 'BLOCKED'

  return (
    <TableRow className={cn(isBlocked && 'opacity-60')}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-foreground">
              {member.firstName} {member.lastName}
              {isSelf && (
                <span className="text-xs text-slate-400 dark:text-muted-foreground ml-2">(ви)</span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-muted-foreground">{member.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={ROLE_BADGE[member.role] ?? ''}>
          {ROLE_LABEL[member.role] ?? member.role}
        </Badge>
      </TableCell>
      <TableCell>
        {member.managedStores.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {member.managedStores.slice(0, 3).map(s => (
              <span
                key={s.id}
                className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-muted/40 dark:text-muted-foreground"
              >
                {s.name}
              </span>
            ))}
            {member.managedStores.length > 3 && (
              <span className="text-xs text-slate-400 dark:text-muted-foreground">
                +{member.managedStores.length - 3}
              </span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell className="text-center">
        <span className={cn(
          'inline-flex items-center gap-1.5 text-xs',
          member.hasOpenShift
            ? 'text-emerald-600 dark:text-emerald-300'
            : 'text-slate-400 dark:text-muted-foreground',
        )}>
          <span className={cn(
            'size-1.5 rounded-full',
            member.hasOpenShift
              ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'
              : 'bg-slate-300 dark:bg-muted-foreground/40',
          )} />
          {member.hasOpenShift ? 'Зараз' : 'Ні'}
        </span>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            isBlocked
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
          )}
        >
          {isBlocked ? 'Заблокований' : 'Активний'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {showStatusButton && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleToggle}
            disabled={pending}
            title={isBlocked ? 'Розблокувати' : 'Заблокувати'}
            className={cn(
              isBlocked
                ? 'text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300'
                : 'text-slate-400 hover:text-rose-600 dark:text-muted-foreground dark:hover:text-rose-300',
            )}
          >
            {isBlocked ? <UnlockIcon className="size-4" /> : <LockIcon className="size-4" />}
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

export { StaffRow }
