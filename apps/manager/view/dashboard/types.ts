import type { IDashboardKpis, IRevenueByHour, ITopShop, IActivityEvent, IAlert } from '@pkg/db'

export interface IDashboardViewProps {
  kpis: IDashboardKpis
  revenueByHour: IRevenueByHour[]
  topShops: ITopShop[]
  activity: IActivityEvent[]
  alerts: IAlert[]
}
