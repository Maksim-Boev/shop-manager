import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { Card, CardContent, Button } from '@pkg/ui'
import { TransferForm } from './components/transfer-form'
import type { ITransfersNewViewProps } from './types'

const TransfersNewView = ({ stores, productsByStore }: ITransfersNewViewProps) => (
  <div className="max-w-3xl space-y-6">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon-sm" asChild>
        <Link href="/transfers" title="Назад">
          <ChevronLeftIcon className="size-5" />
        </Link>
      </Button>
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-foreground tracking-tight">
          Нове переміщення
        </h1>
        <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">Чернетка</p>
      </div>
    </div>

    <Card>
      <CardContent>
        {stores.length < 2 ? (
          <p className="text-sm text-slate-400 dark:text-muted-foreground">
            Для переміщення потрібно щонайменше два активні магазини
          </p>
        ) : (
          <TransferForm stores={stores} productsByStore={productsByStore} />
        )}
      </CardContent>
    </Card>
  </div>
)

export { TransfersNewView }
