import type { ICategoryWithSubs, ITaxRate } from '@pkg/db'

export interface IAddProductDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  categories: ICategoryWithSubs[]
  taxRates: ITaxRate[]
}
