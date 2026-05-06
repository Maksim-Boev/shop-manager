import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import {
  prisma, getShopOverview, getShopStock, getShopStaff,
  getAvailableStaffForShop, getShopFinance,
} from '@pkg/db'
import { ShopDetailView } from '@/view/shops-detail'
import type { TTabKey, TTabData, TRange } from '@/view/shops-detail'

const VALID_TABS: TTabKey[] = ['overview', 'stock', 'staff', 'finance']

interface IProps {
  params: Promise<{ shopId: string }>
  searchParams: Promise<{ tab?: string; range?: string }>
}

const ShopDetailPage = async ({ params, searchParams }: IProps) => {
  const session = await auth()
  if (!session) redirect('/login')

  const { shopId } = await params
  const { tab: rawTab, range: rawRange } = await searchParams

  const companyId = session.user.companyId ?? ''

  const shop = await prisma.store.findFirst({
    where: { id: shopId, companyId, type: 'SHOP' },
    select: {
      id: true, name: true, address: true, region: true,
      openingHours: true, phone: true, status: true,
    },
  })
  if (!shop) notFound()

  const activeTab: TTabKey = VALID_TABS.includes(rawTab as TTabKey)
    ? (rawTab as TTabKey)
    : 'overview'

  const range: TRange = rawRange === 'month' ? 'month' : 'week'

  let tabData: TTabData

  if (activeTab === 'overview') {
    const data = await getShopOverview(shopId, companyId)
    tabData = { tab: 'overview', data }
  } else if (activeTab === 'stock') {
    const data = await getShopStock(shopId, companyId)
    tabData = { tab: 'stock', data }
  } else if (activeTab === 'staff') {
    const [data, availableUsers] = await Promise.all([
      getShopStaff(shopId, companyId),
      getAvailableStaffForShop(shopId, companyId),
    ])
    tabData = { tab: 'staff', data, availableUsers }
  } else {
    const data = await getShopFinance(shopId, companyId, range)
    tabData = { tab: 'finance', data, range }
  }

  return (
    <ShopDetailView
      shop={shop}
      activeTab={activeTab}
      tabData={tabData}
      userRole={session.user.role}
    />
  )
}

export default ShopDetailPage
