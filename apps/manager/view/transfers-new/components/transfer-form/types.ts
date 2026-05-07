import type { ITransferableStore, IStoreProductOption } from '@pkg/db'

export interface ITransferFormProps {
  stores: ITransferableStore[]
  productsByStore: Record<string, IStoreProductOption[]>
}

export interface IFormItem {
  key: number
  productId: string
  quantity: string
}
