'use client'

import { useState, useTransition } from 'react'
import { PlusIcon, PencilIcon, Trash2Icon, CalendarIcon } from 'lucide-react'
import {
  Button,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { deleteScheduleException } from '@/actions/schedule'
import { ExceptionModal } from '../exception-modal'
import type { IExceptionsListProps, IExceptionRow } from './types'

const fmtDate = (exc: IExceptionRow): string => {
  const d = exc.day.toString().padStart(2, '0')
  const m = exc.month.toString().padStart(2, '0')
  return exc.year === null ? `Щороку ${d}.${m}` : `${d}.${m}.${exc.year}`
}

const fmtMode = (exc: IExceptionRow): string => {
  if (!exc.isOpen) return 'Зачинено'
  if (exc.from && exc.to) return `${exc.from}–${exc.to}`
  return 'Скорочений'
}

const ExceptionsList = ({ shopId, exceptions }: IExceptionsListProps) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<IExceptionRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    setDeletingId(id)
    startTransition(async () => {
      await deleteScheduleException(id, shopId)
      setDeletingId(null)
    })
  }

  const handleModalClose = (open: boolean) => {
    setModalOpen(open)
    if (!open) setEditing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-foreground">Виключення</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="gap-1.5"
        >
          <PlusIcon className="size-3.5" />
          Додати виключення
        </Button>
      </div>

      {exceptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-muted-foreground border border-dashed border-slate-200 dark:border-border rounded-xl">
          <CalendarIcon className="size-8 mb-2" />
          <span className="text-sm">Виключень ще немає</span>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Режим</TableHead>
                <TableHead>Примітка</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {exceptions.map(exc => (
                <TableRow key={exc.id}>
                  <TableCell className="font-medium text-slate-900 dark:text-foreground">
                    {fmtDate(exc)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-semibold rounded-full',
                        exc.isOpen
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
                      )}
                    >
                      {fmtMode(exc)}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 dark:text-muted-foreground text-sm">
                    {exc.note ?? '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditing(exc); setModalOpen(true) }}
                        className="h-7 w-7 p-0"
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(exc.id)}
                        disabled={isPending && deletingId === exc.id}
                        className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 dark:text-rose-400"
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ExceptionModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        shopId={shopId}
        editingException={editing}
      />
    </div>
  )
}

export { ExceptionsList }
