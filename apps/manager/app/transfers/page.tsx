import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getTransfers } from '@pkg/db'
import { TransfersView, type TStateTab } from '@/view/transfers'

const VALID_STATES = ['DRAFT', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'] as const
type TActualState = typeof VALID_STATES[number]
const isState = (v: string | undefined): v is TActualState =>
  typeof v === 'string' && (VALID_STATES as readonly string[]).includes(v)

interface ITransfersPageProps {
  searchParams: Promise<{ state?: string }>
}

const TransfersPage = async ({ searchParams }: ITransfersPageProps) => {
  const session = await auth()
  if (!session) redirect('/login')

  const { state: stateRaw } = await searchParams
  const stateFilter: TActualState | undefined = isState(stateRaw) ? stateRaw : undefined
  const activeTab: TStateTab = stateFilter ?? 'ALL'

  const companyId = session.user.companyId ?? ''
  const transfers = await getTransfers(companyId, stateFilter)

  return (
    <TransfersView
      transfers={transfers}
      activeState={activeTab}
      userRole={session.user.role}
    />
  )
}

export default TransfersPage
