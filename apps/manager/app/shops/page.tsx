import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getShopsWithStats } from '@pkg/db'
import { ShopsView } from '@/view/shops'

const ShopsPage = async () => {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId ?? ''
  const shops = await getShopsWithStats(companyId)

  return <ShopsView shops={shops} userRole={session.user.role} />
}

export default ShopsPage
