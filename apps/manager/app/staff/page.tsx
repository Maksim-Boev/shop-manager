import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getStaffList, prisma } from '@pkg/db'
import { StaffView } from '@/view/staff'

const StaffPage = async () => {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId ?? ''

  const [staff, stores] = await Promise.all([
    getStaffList(companyId),
    prisma.store.findMany({
      where: { companyId, type: 'SHOP' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <StaffView
      staff={staff}
      actorRole={session.user.role}
      actorId={session.user.id}
      stores={stores}
    />
  )
}

export default StaffPage
