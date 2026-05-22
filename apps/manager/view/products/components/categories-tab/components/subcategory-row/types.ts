export interface ISubcategoryRowProps {
  subcategory: { id: string; name: string; sortOrder: number }
  categoryName: string
  onMutation: () => void
}
