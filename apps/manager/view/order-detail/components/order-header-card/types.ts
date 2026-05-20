import type { IOrderDetail } from '@pkg/db'

export interface IOrderHeaderCardProps {
  order: IOrderDetail
  accentBg: string
  accentFg: string
}
