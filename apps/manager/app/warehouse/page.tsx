import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import {
  getWarehouseStores,
  getWarehouseStock,
  getPendingPurchaseOrders,
} from '@pkg/db'
import { WarehouseView } from '@/view/warehouse'

interface IWarehousePageProps {
  searchParams: Promise<{ warehouseId?: string }>
}

const WarehousePage = async ({ searchParams }: IWarehousePageProps) => {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId ?? ''
  const { warehouseId } = await searchParams

  const warehouses = await getWarehouseStores(companyId)

  if (warehouses.length === 0) {
    return (
      <WarehouseView
        warehouses={[]}
        activeWarehouse={null}
        stock={[]}
        pendingOrders={[]}
      />
    )
  }

  const requested = warehouseId
    ? warehouses.find(w => w.id === warehouseId)
    : undefined
  const active = requested ?? warehouses[0]

  const [stock, pendingOrders] = await Promise.all([
    getWarehouseStock(active.id, companyId),
    getPendingPurchaseOrders(companyId, active.id),
  ])

  return (
    <WarehouseView
      warehouses={warehouses}
      activeWarehouse={active}
      stock={stock}
      pendingOrders={pendingOrders}
    />
  )
}

export default WarehousePage
