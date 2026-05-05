import { ShopCard } from './ShopCard'
import type { IShopsGridProps } from '../types'

const ShopsGrid = ({ shops }: IShopsGridProps) => {
  if (shops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <p className="text-sm">Магазини не знайдені</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {shops.map(shop => (
        <ShopCard key={shop.id} shop={shop} />
      ))}
    </div>
  )
}

export { ShopsGrid }
