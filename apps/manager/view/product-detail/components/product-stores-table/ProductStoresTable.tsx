import Link from 'next/link'
import { Badge, Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@pkg/ui'
import type { IProductStoresTableProps } from './types'

const fmt = (n: number) =>
  n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ProductStoresTable = ({ stores }: IProductStoresTableProps) => (
  <Card>
    <CardHeader className="pb-2">
      <h3 className="font-semibold text-foreground">Наявність у магазинах</h3>
    </CardHeader>
    <CardContent className="pt-0 px-0">
      {stores.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 px-6">
          Товар не прив&apos;язаний до жодного магазину
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Магазин</TableHead>
              <TableHead className="text-right w-32">Залишок</TableHead>
              <TableHead className="text-right w-36">Ціна (ефект.)</TableHead>
              <TableHead className="w-28">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map(s => (
              <TableRow key={s.storeId} className="hover:bg-muted/40">
                <TableCell>
                  <Link href={`/shops/${s.storeId}?tab=stock`} className="text-foreground hover:text-primary transition-colors font-medium">
                    {s.storeName}
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  <span className={
                    s.stock === 0 ? 'text-rose-600 dark:text-rose-400 font-medium' :
                    s.stock < 10 ? 'text-amber-600 dark:text-amber-400 font-medium' :
                    'text-foreground'
                  }>
                    {s.stock % 1 === 0 ? s.stock : s.stock.toFixed(3)}
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm">
                  <span>{fmt(s.effectivePrice)} грн.</span>
                  {s.priceOverride !== null && (
                    <span className="ml-1.5 text-xs text-indigo-600 dark:text-indigo-400">(override)</span>
                  )}
                </TableCell>
                <TableCell>
                  {s.isAvailable ? (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      Активний
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400">
                      Вимкнено
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
)

export { ProductStoresTable }
