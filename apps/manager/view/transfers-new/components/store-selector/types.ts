import type { ITransferableStore } from '@pkg/db'

export interface IStoreSelectorProps {
  label: string
  value: string
  onChange: (v: string) => void
  stores: ITransferableStore[]
  disabledId?: string
}
