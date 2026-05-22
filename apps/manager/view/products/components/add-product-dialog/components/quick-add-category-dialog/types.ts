export interface IQuickAddCategoryDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (categoryId: string) => void
}
