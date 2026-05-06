import type { IShopBasic, TTabKey } from '../../types'
import type { UserRole } from '@pkg/db/browser'

export interface IShopHeaderProps {
  shop: IShopBasic
  userRole: UserRole
  activeTab: TTabKey
  tabs: TTabKey[]
  onTabChange: (tab: TTabKey) => void
}
