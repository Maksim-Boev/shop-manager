import type { ITransferRow } from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export type TStateTab = 'ALL' | 'DRAFT' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'

export interface ITransfersViewProps {
  transfers: ITransferRow[]
  activeState: TStateTab
  userRole: UserRole
}
