import {
  Table, TableHeader, TableBody, TableHead, TableRow,
} from '@pkg/ui'
import { TransferRow } from '../transfer-row'
import type { ITransfersTableProps } from './types'

const TransfersTable = ({ transfers, userRole }: ITransfersTableProps) => {
  if (transfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-muted-foreground">
        <p className="text-sm">Переміщень не знайдено</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Маршрут</TableHead>
          <TableHead className="text-right">Позицій</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Створено</TableHead>
          <TableHead>Завершено</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {transfers.map(t => (
          <TransferRow key={t.id} transfer={t} userRole={userRole} />
        ))}
      </TableBody>
    </Table>
  )
}

export { TransfersTable }
