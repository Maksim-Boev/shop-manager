import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import {
  getDashboardKpis,
  getRevenueByHour,
  getTopShops,
  getActivityFeed,
  getAlerts,
} from '@pkg/db'
import { DashboardView } from '@/view/dashboard/DashboardView'

const DashboardPage = async () => {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId ?? ''
  const today = new Date()

  const [kpis, revenueByHour, topShops, activity, alerts] = await Promise.all([
    getDashboardKpis(companyId, today),
    getRevenueByHour(companyId, today),
    getTopShops(companyId, today, 5),
    getActivityFeed(companyId, 20),
    getAlerts(companyId),
  ])

  return (
    <DashboardView
      kpis={kpis}
      revenueByHour={revenueByHour}
      topShops={topShops}
      activity={activity}
      alerts={alerts}
    />
  )
}

export default DashboardPage
