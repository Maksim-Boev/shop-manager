import type { IShopOverview } from '@pkg/db'

export interface IOverviewTabProps {
  data: IShopOverview
  onGoToStock: () => void
}
