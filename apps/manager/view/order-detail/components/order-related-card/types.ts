import type { IOrderRow } from '@pkg/db'

export interface IOrderRelatedCardProps {
  orders: IOrderRow[]
  storeName: string
  currentDate: Date
}
