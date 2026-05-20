import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getOrderDetail, getRelatedOrders, getCashierDayStats } from '@pkg/db'
import { OrderDetailView } from '@/view/order-detail'

interface IProps {
  params: Promise<{ id: string }>
}

const OrderDetailPage = async ({ params }: IProps) => {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const companyId = session.user.companyId ?? ''

  const order = await getOrderDetail(companyId, id)
  if (!order) notFound()

  const [relatedOrders, cashierStats] = await Promise.all([
    getRelatedOrders(companyId, order.store.id, id, order.createdAt),
    getCashierDayStats(companyId, order.cashier.id, order.createdAt),
  ])

  return <OrderDetailView order={order} relatedOrders={relatedOrders} cashierStats={cashierStats} />
}

export default OrderDetailPage
