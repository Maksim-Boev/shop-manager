import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getProductDetail, getCategories, getTaxRates } from '@pkg/db'
import { ProductDetailView } from '@/view/product-detail'

interface IProductPageProps {
  params: Promise<{ id: string }>
}

const ProductPage = async ({ params }: IProductPageProps) => {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const companyId = session.user.companyId ?? ''

  const [product, categories, taxRates] = await Promise.all([
    getProductDetail(id, companyId),
    getCategories(companyId),
    getTaxRates(companyId),
  ])

  if (!product) notFound()

  const canEdit = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)

  return (
    <ProductDetailView
      product={product}
      categories={categories}
      taxRates={taxRates}
      canEdit={canEdit}
    />
  )
}

export default ProductPage
