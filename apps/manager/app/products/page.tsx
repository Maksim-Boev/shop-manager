import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getProducts, getCategories, getTaxRates } from '@pkg/db'
import { ProductsView } from '@/view/products'

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) => {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId ?? ''
  const { tab } = await searchParams
  const activeTab = tab === 'categories' ? 'categories' : 'products'

  const categories = await getCategories(companyId)

  if (activeTab === 'categories') {
    return <ProductsView defaultTab="categories" categories={categories} />
  }

  const [products, taxRates] = await Promise.all([
    getProducts(companyId),
    getTaxRates(companyId),
  ])

  return (
    <ProductsView
      defaultTab="products"
      categories={categories}
      products={products}
      taxRates={taxRates}
    />
  )
}

export default ProductsPage
