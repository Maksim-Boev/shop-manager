import { StaffInfoCard } from './components/staff-info-card'
import { SalaryCard } from './components/salary-card'
import { SalaryHistory } from './components/salary-history'
import { DeleteStaffButton } from './components/delete-staff-button'
import { StaffBreadcrumb } from './components/staff-breadcrumb'
import type { IStaffDetailViewProps } from './types'

const StaffDetailView = ({ member, stores, actorRole, actorId }: IStaffDetailViewProps) => {
  const isSelf = member.id === actorId
  const canDelete =
    !isSelf &&
    member.role !== 'SUPER_ADMIN' &&
    (actorRole === 'SUPER_ADMIN' || (actorRole === 'ADMIN' && member.role !== 'ADMIN'))

  return (
    <div className="space-y-6 max-w-4xl">
      <StaffBreadcrumb firstName={member.firstName} lastName={member.lastName} />

      {canDelete && (
        <div className="flex justify-end">
          <DeleteStaffButton
            userId={member.id}
            displayName={`${member.firstName} ${member.lastName}`}
          />
        </div>
      )}

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <StaffInfoCard
          member={member}
          stores={stores}
          actorRole={actorRole}
          actorId={actorId}
        />
        <SalaryCard
          userId={member.id}
          currentRate={member.currentSalaryRate}
          actorRole={actorRole}
        />
      </div>

      {/* Salary history */}
      <SalaryHistory payouts={member.recentPayouts} />
    </div>
  )
}

export { StaffDetailView }
