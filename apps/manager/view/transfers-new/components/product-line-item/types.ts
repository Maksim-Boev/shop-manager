import type { IStoreProductOption } from '@pkg/db'

export interface IProductLineItemProps {
  productId: string
  quantity: string
  onProduct: (id: string) => void
  onQuantity: (q: string) => void
  onRemove: () => void
  options: IStoreProductOption[]
}
