import type { IWarehouseStore } from '@pkg/db'

export interface IWarehouseSelectorProps {
  warehouses: IWarehouseStore[]
  activeId: string
}
