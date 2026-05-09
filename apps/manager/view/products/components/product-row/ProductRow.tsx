import Link from 'next/link'
import { Badge, TableCell, TableRow } from '@pkg/ui'
import type { IProductRowProps } from './types'

const UNIT_LABELS: Record<string, string> = {
  PIECE: 'шт.',
  KG: 'кг',
  GRAM: 'г',
  LITER: 'л',
  MILLILITER: 'мл',
  METER: 'м',
  PACK: 'пак.',
}

const fmt = (n: number) =>
  n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ProductRow = ({ product }: IProductRowProps) => {
  const margin =
    product.costPrice !== null && product.basePrice > 0
      ? ((product.basePrice - product.costPrice) / product.basePrice) * 100
      : null

  return (
    <TableRow className="hover:bg-muted/40 cursor-pointer">
      <TableCell>
        <Link href={`/products/${product.id}`} className="block">
          <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
        </Link>
      </TableCell>
      <TableCell>
        <Link href={`/products/${product.id}`} className="block font-medium text-foreground hover:text-primary transition-colors">
          {product.name}
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{product.categoryName}</TableCell>
      <TableCell className="text-muted-foreground text-sm">{UNIT_LABELS[product.unit] ?? product.unit}</TableCell>
      <TableCell className="text-right font-medium">{fmt(product.basePrice)} грн.</TableCell>
      <TableCell className="text-right text-muted-foreground text-sm">
        {product.costPrice !== null ? `${fmt(product.costPrice)} грн.` : '—'}
      </TableCell>
      <TableCell className="text-right">
        {margin !== null ? (
          <span className={margin >= 20 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : margin >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}>
            {margin.toFixed(1)}%
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-center text-sm text-muted-foreground">
        {product.storesCount}
      </TableCell>
      <TableCell>
        {product.status === 'ACTIVE' ? (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            Активний
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400">
            Архів
          </Badge>
        )}
      </TableCell>
    </TableRow>
  )
}

export { ProductRow }
