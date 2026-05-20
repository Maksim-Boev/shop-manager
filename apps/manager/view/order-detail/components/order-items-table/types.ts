import type { IOrderDetail } from '@pkg/db'

export interface IOrderItemsTableProps {
  items: IOrderDetail['items']
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  pointsRedeemed: number
  pointsEarned: number
}
