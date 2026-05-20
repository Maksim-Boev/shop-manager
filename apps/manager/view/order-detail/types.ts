import type { IOrderDetail, IOrderRow, ICashierDayStats } from '@pkg/db'

export interface IOrderDetailViewProps {
  order: IOrderDetail
  relatedOrders: IOrderRow[]
  cashierStats: ICashierDayStats
}
