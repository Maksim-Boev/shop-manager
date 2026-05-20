export interface IOrderTimelineCardProps {
  createdAt: Date
  paidAt: Date | null
  cashierName: string
  storeName: string
  state: string
}
