import type { ITransferableStore, IStoreProductOption } from '@pkg/db'

export interface ITransfersNewViewProps {
  stores: ITransferableStore[]
  productsByStore: Record<string, IStoreProductOption[]>
}
