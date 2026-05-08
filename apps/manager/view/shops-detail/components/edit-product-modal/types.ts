export interface IEditProductModalProduct {
  id: string
  sku: string
  name: string
  unit: string
  basePrice: number
  costPrice: number | null
}

export interface IEditProductModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  product: IEditProductModalProduct | null
}
