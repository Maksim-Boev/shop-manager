'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MailIcon, StoreIcon, PlusIcon } from 'lucide-react'
import {
  Avatar, AvatarFallback, Badge, Button, Card, CardContent,
  Popover, PopoverContent, PopoverTrigger,
} from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { setStoreAssignment } from '@/actions/staff'
import type { IStaffInfoCardProps } from './types'

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

const StaffInfoCard = ({ member, stores, actorRole, actorId }: IStaffInfoCardProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const isSelf = member.id === actorId
  const canEdit = !isSelf && (actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN') && member.role !== 'SUPER_ADMIN'

  const currentIds = member.managedStores.map(s => s.id)
  const availableToAdd = stores.filter(s => !currentIds.includes(s.id))
  const isBlocked = member.status === 'BLOCKED'
  const accent = getAccent(member.id)
  const initials = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase()

  const handleAdd = (storeId: string) => {
    startTransition(async () => {
      try {
        await setStoreAssignment({
          userId: member.id,
          storeIds: [...currentIds, storeId],
        })
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Помилка')
      }
    })
  }

  const handleRemove = (storeId: string) => {
    startTransition(async () => {
      try {
        await setStoreAssignment({
          userId: member.id,
          storeIds: currentIds.filter(id => id !== storeId),
        })
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Помилка')
      }
    })
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        {/* Avatar + name */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar className="size-16">
              <AvatarFallback className={cn('text-lg font-bold', AVATAR_CLASSES[accent])}>
                {initials}
              </AvatarFallback>
            </Avatar>
            {member.hasOpenShift && (
              <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-500 border-2 border-card" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-foreground">
              {member.firstName} {member.lastName}
              {isSelf && (
                <span className="ml-2 text-sm font-normal text-slate-400 dark:text-muted-foreground">(ви)</span>
              )}
            </h2>
            <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
              {ROLE_LABEL[member.role] ?? member.role}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
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
        </div>

        <div className="border-t border-border" />

        {/* Email */}
        <div className="flex items-center gap-2.5 text-sm">
          <MailIcon className="size-4 text-slate-400 dark:text-muted-foreground shrink-0" />
          <span className="text-slate-700 dark:text-muted-foreground">{member.email}</span>
        </div>

        {/* Store assignments */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-muted-foreground uppercase font-bold tracking-wide">
            <StoreIcon className="size-3.5" />
            Призначені магазини
          </div>

          {member.managedStores.length === 0 ? (
            <p className="text-sm text-rose-600 dark:text-rose-300">Не призначено</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {member.managedStores.map(s => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-muted text-xs font-medium text-slate-700 dark:text-foreground"
                >
                  {s.name}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleRemove(s.id)}
                      disabled={pending}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-300"
                      aria-label={`Зняти ${s.name}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {canEdit && availableToAdd.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5" disabled={pending}>
                  <PlusIcon className="size-3.5" /> магазин
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-1" align="start">
                <div className="max-h-64 overflow-y-auto">
                  {availableToAdd.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleAdd(s.id)}
                      disabled={pending}
                      className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-slate-100 dark:hover:bg-muted/40"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { StaffInfoCard }
