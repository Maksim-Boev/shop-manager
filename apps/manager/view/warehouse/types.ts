import type {
  IWarehouseStore,
  IWarehouseStockRow,
  IPurchaseOrderRow,
} from '@pkg/db'

export interface IWarehouseViewProps {
  warehouses: IWarehouseStore[]
  activeWarehouse: IWarehouseStore | null
  stock: IWarehouseStockRow[]
  pendingOrders: IPurchaseOrderRow[]
}
