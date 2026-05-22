import type { IProductRow } from '@pkg/db'

export interface IAdjustStockDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  storeId: string
  allProducts: IProductRow[]
  currentStock: Map<string, number>
}
