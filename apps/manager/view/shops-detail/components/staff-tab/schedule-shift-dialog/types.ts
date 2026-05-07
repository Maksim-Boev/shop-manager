import type { IScheduledShiftRow, IStoreUserOption } from '@pkg/db'

export interface IScheduleShiftDialogProps {
  shopId: string
  storeUsers: IStoreUserOption[]
  open: boolean
  onOpenChange: (v: boolean) => void
  // Для редактирования
  editing?: IScheduledShiftRow | null
  // Для создания: предзаполненная дата (YYYY-MM-DD)
  defaultDateIso?: string
}
