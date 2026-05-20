import type { IStoreOption } from '../../types'

export interface IOrdersFilterProps {
  stores: IStoreOption[]
  search: string
  storeId: string
  state: string
  payment: string
  datePreset: string
  onSearch: (v: string) => void
  onStore: (v: string) => void
  onState: (v: string) => void
  onPayment: (v: string) => void
  onDatePreset: (v: string) => void
}
