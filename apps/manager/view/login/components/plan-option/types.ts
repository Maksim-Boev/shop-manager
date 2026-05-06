import type { TPlan } from '../../types'

export interface IPlanOptionProps {
  value: TPlan
  active: boolean
  onClick: () => void
  title: string
  desc: string
  price: string
  badge?: string
  featured?: boolean
}
