import type { IOrderRow } from '@pkg/db'

export interface IStoreOption {
  id: string
  name: string
}

export interface IOrdersViewProps {
  orders: IOrderRow[]
  stores: IStoreOption[]
}
