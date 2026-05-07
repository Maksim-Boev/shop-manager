import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import {
  getTransferableStores,
  getStoreProductsForTransfer,
  type IStoreProductOption,
} from '@pkg/db'
import { TransfersNewView } from '@/view/transfers-new'

const TransfersNewPage = async () => {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/transfers')
  }

  const companyId = session.user.companyId ?? ''
  const stores = await getTransferableStores(companyId)

  const productLists = await Promise.all(
    stores.map(s => getStoreProductsForTransfer(s.id, companyId)),
  )
  const productsByStore: Record<string, IStoreProductOption[]> = {}
  stores.forEach((s, i) => {
    productsByStore[s.id] = productLists[i]
  })

  return <TransfersNewView stores={stores} productsByStore={productsByStore} />
}

export default TransfersNewPage
