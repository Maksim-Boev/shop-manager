export type TSubcategoryDialogMode = 'create' | 'edit'

export interface ISubcategoryDialogProps {
  mode: TSubcategoryDialogMode
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  categoryName: string
  categoryId?: string
  subcategoryId?: string
  initial?: { id: string; name: string; sortOrder: number }
}
