import {
  Table, TableHeader, TableBody, TableHead, TableRow,
} from '@pkg/ui'
import { StaffRow } from '../staff-row'
import type { IStaffTableProps } from './types'

const StaffTable = ({ staff, actorRole, actorId }: IStaffTableProps) => {
  if (staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-muted-foreground">
        <p className="text-sm">Користувачів не знайдено</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Користувач</TableHead>
          <TableHead>Роль</TableHead>
          <TableHead>Магазини</TableHead>
          <TableHead className="text-center">Зміна</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.map(m => (
          <StaffRow key={m.id} member={m} actorRole={actorRole} actorId={actorId} />
        ))}
      </TableBody>
    </Table>
  )
}

export { StaffTable }
