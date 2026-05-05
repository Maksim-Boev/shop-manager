import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { DashboardShell } from '@/components/layout/DashboardShell'

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth()
  if (!session) redirect('/login')

  const cookieStore = await cookies()
  const defaultCompact = cookieStore.get('sidebar_compact')?.value === 'true'

  return (
    <DashboardShell user={session.user} defaultCompact={defaultCompact}>
      {children}
    </DashboardShell>
  )
}

export default DashboardLayout
