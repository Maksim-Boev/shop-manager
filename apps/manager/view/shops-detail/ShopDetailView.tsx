'use client'

import { useRouter } from 'next/navigation'
import { ShopHeader } from './components/shop-header'
import { OverviewTab } from './components/overview-tab'
import { StockTab } from './components/stock-tab'
import { StaffTab } from './components/staff-tab'
import { FinanceTab } from './components/finance-tab'
import type { IShopDetailViewProps, TTabKey } from './types'

const TABS: TTabKey[] = ['overview', 'stock', 'staff', 'finance']

const ShopDetailView = ({ shop, activeTab, tabData, userRole }: IShopDetailViewProps) => {
  const router = useRouter()

  const goToTab = (tab: TTabKey) => {
    router.push(`/shops/${shop.id}?tab=${tab}`)
  }

  return (
    <div className="space-y-6">
      <ShopHeader
        shop={shop}
        userRole={userRole}
        activeTab={activeTab}
        tabs={TABS}
        onTabChange={goToTab}
      />

      {tabData.tab === 'overview' && (
        <OverviewTab data={tabData.data} onGoToStock={() => goToTab('stock')} />
      )}
      {tabData.tab === 'stock' && (
        <StockTab items={tabData.data} />
      )}
      {tabData.tab === 'staff' && (
        <StaffTab
          members={tabData.data}
          availableUsers={tabData.availableUsers}
          shopId={shop.id}
          userRole={userRole}
        />
      )}
      {tabData.tab === 'finance' && (
        <FinanceTab data={tabData.data} shopId={shop.id} range={tabData.range} />
      )}
    </div>
  )
}

export { ShopDetailView }
