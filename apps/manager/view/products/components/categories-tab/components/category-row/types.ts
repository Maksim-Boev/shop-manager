import type { ICategoryWithSubs } from '@pkg/db'

export interface ICategoryRowProps {
  category: ICategoryWithSubs
  isOpen: boolean
  onToggle: () => void
  onMutation: () => void
}
