import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import {
  prisma, getShopOverview, getShopStock, getShopStaff,
  getAvailableStaffForShop, getShopFinance,
  getShopSchedule, getStoreUsersForScheduling,
} from '@pkg/db'
import { ShopDetailView } from '@/view/shops-detail'
import type { TTabKey, TTabData, TRange } from '@/view/shops-detail'

const VALID_TABS: TTabKey[] = ['overview', 'stock', 'staff', 'finance']

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const getMondayOfWeek = (d: Date): Date => {
  const dow = d.getDay()
  const offset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset)
  return monday
}

const pad = (n: number) => n.toString().padStart(2, '0')
const fmtDateIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

interface IProps {
  params: Promise<{ shopId: string }>
  searchParams: Promise<{ tab?: string; range?: string; weekStart?: string }>
}

const ShopDetailPage = async ({ params, searchParams }: IProps) => {
  const session = await auth()
  if (!session) redirect('/login')

  const { shopId } = await params
  const { tab: rawTab, range: rawRange, weekStart: rawWeekStart } = await searchParams

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
    const weekStart = rawWeekStart && ISO_DATE_RE.test(rawWeekStart)
      ? new Date(`${rawWeekStart}T00:00:00`)
      : getMondayOfWeek(new Date())

    const [data, availableUsers, scheduledShifts, storeUsers] = await Promise.all([
      getShopStaff(shopId, companyId),
      getAvailableStaffForShop(shopId, companyId),
      getShopSchedule(shopId, companyId, weekStart),
      getStoreUsersForScheduling(companyId),
    ])
    tabData = {
      tab: 'staff', data, availableUsers,
      scheduledShifts, storeUsers,
      weekStartIso: fmtDateIso(weekStart),
    }
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
