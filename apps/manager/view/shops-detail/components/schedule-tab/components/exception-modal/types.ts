import type { IStoreScheduleException } from '@pkg/db'

export interface IExceptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shopId: string
  editingException: IStoreScheduleException | null
}
