import type { IOrderDetail } from '@pkg/db'

export interface IOrderDeliveryCardProps {
  deliveryAddress: IOrderDetail['deliveryAddress']
  deliveryStatus: IOrderDetail['deliveryStatus']
}
