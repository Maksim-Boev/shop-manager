import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getStaffMemberDetail, prisma } from '@pkg/db'
import { StaffDetailView } from '@/view/staff-detail'

interface IStaffDetailPageProps {
  params: Promise<{ id: string }>
}

const StaffDetailPage = async ({ params }: IStaffDetailPageProps) => {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const companyId = session.user.companyId ?? ''

  const [member, stores] = await Promise.all([
    getStaffMemberDetail(id, companyId),
    prisma.store.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!member) notFound()

  return (
    <StaffDetailView
      member={member}
      stores={stores}
      actorRole={session.user.role}
      actorId={session.user.id}
    />
  )
}

export default StaffDetailPage
