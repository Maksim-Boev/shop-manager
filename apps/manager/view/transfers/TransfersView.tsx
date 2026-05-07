import Link from 'next/link'
import { PlusIcon } from 'lucide-react'
import { Button } from '@pkg/ui'
import { TransferStateTabs } from './components/transfer-state-tabs'
import { TransfersTable } from './components/transfers-table'
import type { ITransfersViewProps } from './types'

const TransfersView = ({ transfers, activeState, userRole }: ITransfersViewProps) => {
  const canCreate = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 dark:text-foreground tracking-tight">
            Переміщення
          </h1>
          <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
            {transfers.length} запис.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/transfers/new" className="gap-2">
              <PlusIcon className="size-4" />
              Нове переміщення
            </Link>
          </Button>
        )}
      </div>

      <TransferStateTabs active={activeState} />
      <TransfersTable transfers={transfers} userRole={userRole} />
    </div>
  )
}

export { TransfersView }
