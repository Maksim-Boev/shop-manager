import {
  Table, TableBody, TableHead, TableHeader, TableRow, TableCell,
} from '@pkg/ui'
import { ProductRow } from '../product-row'
import type { IProductsTableProps } from './types'

const ProductsTable = ({ products }: IProductsTableProps) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-sm">Товарів не знайдено</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">SKU</TableHead>
          <TableHead>Назва</TableHead>
          <TableHead>Категорія</TableHead>
          <TableHead className="w-20">Од.</TableHead>
          <TableHead className="text-right w-36">Ціна продажу</TableHead>
          <TableHead className="text-right w-36">Закуп</TableHead>
          <TableHead className="text-right w-24">Маржа</TableHead>
          <TableHead className="text-center w-24">Магазини</TableHead>
          <TableHead className="w-28">Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map(p => (
          <ProductRow key={p.id} product={p} />
        ))}
      </TableBody>
    </Table>
  )
}

export { ProductsTable }
