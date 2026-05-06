import type { IRevenueByHour } from '@pkg/db'

export interface IRevenueChartProps {
  data: IRevenueByHour[]
  totalRevenue: string
}
