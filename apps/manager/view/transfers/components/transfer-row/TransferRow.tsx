'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckIcon, XIcon, MoreHorizontalIcon, ArrowRightIcon,
} from 'lucide-react'
import {
  Badge, Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem,
  TableRow, TableCell,
} from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { completeTransfer, cancelTransfer } from '@/actions/transfers'
import type { ITransferRowProps } from './types'

const STATE_LABEL: Record<string, string> = {
  DRAFT:      'Чернетка',
  IN_TRANSIT: 'У дорозі',
  COMPLETED:  'Завершено',
  CANCELLED:  'Скасовано',
}

const STATE_BADGE: Record<string, string> = {
  DRAFT:      'border-slate-200 bg-slate-100 text-slate-600 dark:border-border dark:bg-muted/40 dark:text-muted-foreground',
  IN_TRANSIT: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
  COMPLETED:  'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
  CANCELLED:  'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300',
}

const TransferRow = ({ transfer, userRole }: ITransferRowProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const canManage = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const canComplete = canManage && transfer.state === 'IN_TRANSIT'
  const canCancel   = canManage && transfer.state === 'DRAFT'
  const showMenu    = canComplete || canCancel

  const handleComplete = () => {
    startTransition(async () => {
      try {
        await completeTransfer({ transferId: transfer.id })
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Помилка')
      }
    })
  }
  const handleCancel = () => {
    startTransition(async () => {
      try {
        await cancelTransfer({ transferId: transfer.id })
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Помилка')
      }
    })
  }

  const shortId = transfer.id.slice(-6).toUpperCase()

  return (
    <TableRow>
      <TableCell>
        <div className="font-mono text-xs text-slate-500 dark:text-muted-foreground uppercase">
          #{shortId}
        </div>
        <div className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5 tabular-nums">
          {transfer.createdAt.toLocaleDateString('uk-UA')}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-slate-900 dark:text-foreground">
            {transfer.sourceStoreName}
          </span>
          <ArrowRightIcon className="size-3.5 text-slate-400 dark:text-muted-foreground shrink-0" />
          <span className="font-medium text-slate-900 dark:text-foreground">
            {transfer.destinationStoreName}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums text-slate-600 dark:text-muted-foreground">
        {transfer.itemsCount}
      </TableCell>
      <TableCell className="text-right tabular-nums font-semibold text-slate-900 dark:text-foreground">
        {transfer.totalQty} шт.
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn(STATE_BADGE[transfer.state])}>
          {STATE_LABEL[transfer.state]}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {showMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" disabled={pending}>
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canComplete && (
                <DropdownMenuItem onClick={handleComplete}>
                  <CheckIcon className="size-4" />
                  Завершити
                </DropdownMenuItem>
              )}
              {canCancel && (
                <DropdownMenuItem
                  onClick={handleCancel}
                  className="text-rose-600 dark:text-rose-300"
                >
                  <XIcon className="size-4" />
                  Скасувати
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  )
}

export { TransferRow }
