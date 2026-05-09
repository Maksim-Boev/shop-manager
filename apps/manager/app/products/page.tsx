import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getProducts, getCategories, getTaxRates } from '@pkg/db'
import { ProductsView } from '@/view/products'

const ProductsPage = async () => {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId ?? ''

  const [products, categories, taxRates] = await Promise.all([
    getProducts(companyId),
    getCategories(companyId),
    getTaxRates(companyId),
  ])

  return (
    <ProductsView
      products={products}
      categories={categories}
      taxRates={taxRates}
    />
  )
}

export default ProductsPage
