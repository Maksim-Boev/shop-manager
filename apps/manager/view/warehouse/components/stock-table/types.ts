import type { IWarehouseStockRow } from '@pkg/db'

export interface IStockTableProps {
  rows: IWarehouseStockRow[]
  warehouseId: string
}
