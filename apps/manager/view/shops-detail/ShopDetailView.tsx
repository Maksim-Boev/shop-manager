'use client'

import { useRouter } from 'next/navigation'
import { ShopHeader } from './components/shop-header'
import { OverviewTab } from './components/overview-tab'
import { StockTab } from './components/stock-tab'
import { StaffTab } from './components/staff-tab'
import { ScheduleTab } from './components/schedule-tab'
import { FinanceTab } from './components/finance-tab'
import type { IShopDetailViewProps, TTabKey } from './types'

const TABS: TTabKey[] = ['overview', 'stock', 'staff', 'schedule', 'finance']

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
          scheduledShifts={tabData.scheduledShifts}
          storeUsers={tabData.storeUsers}
          weekStartIso={tabData.weekStartIso}
          shopId={shop.id}
          userRole={userRole}
        />
      )}
      {tabData.tab === 'schedule' && (
        <ScheduleTab
          shopId={shop.id}
          weeklySchedule={tabData.data.weeklySchedule}
          exceptions={tabData.data.exceptions}
        />
      )}
      {tabData.tab === 'finance' && (
        <FinanceTab data={tabData.data} margin={tabData.margin} shopId={shop.id} range={tabData.range} />
      )}
    </div>
  )
}

export { ShopDetailView }
