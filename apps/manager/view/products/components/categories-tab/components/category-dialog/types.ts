import type { ICategoryWithSubs } from '@pkg/db'

export type TCategoryDialogMode = 'create' | 'edit'

export interface ICategoryDialogProps {
  mode: TCategoryDialogMode
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  initial?: Pick<ICategoryWithSubs, 'id' | 'name' | 'sortOrder'>
}
