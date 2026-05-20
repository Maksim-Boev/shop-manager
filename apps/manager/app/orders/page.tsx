import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getOrders, getWarehouseStores } from '@pkg/db'
import { OrdersView } from '@/view/orders'

const OrdersPage = async () => {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId ?? ''

  const [orders, stores] = await Promise.all([
    getOrders(companyId),
    getWarehouseStores(companyId),
  ])

  return <OrdersView orders={orders} stores={stores} />
}

export default OrdersPage
