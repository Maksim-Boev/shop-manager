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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {staff.map(m => (
        <StaffRow key={m.id} member={m} actorRole={actorRole} actorId={actorId} />
      ))}
    </div>
  )
}

export { StaffTable }
