import type { ITransferRow } from '@pkg/db'
import type { UserRole } from '@pkg/db/browser'

export interface ITransfersTableProps {
  transfers: ITransferRow[]
  userRole: UserRole
}
